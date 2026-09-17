import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Assignment } from 'src/assignment/entities/assignment.entity';
import { RequestContextService } from 'src/request-context/request-context.service';
import { UserClass } from 'src/user-class/entities/user-class.entity';
import { EntityManager, In, IsNull, Not, Repository } from 'typeorm';
import { AssignmentAlertPolicyDto } from './dto/assignment-alert-policy.dto';
import { CreateAssignmentUserAlertDto } from './dto/create-assignment-user-alert.dto';
import { ListAssignmentAlertUsersDto } from './dto/list-assignment-alert-users.dto';
import { AssignmentAlertRule } from './entities/assignment-alert-rule.entity';
import {
  AssignmentAlertDetails,
  AssignmentUserAlert
} from './entities/assignment-user-alert.entity';
import {
  AssignmentAlertType,
  CONFIGURABLE_ASSIGNMENT_ALERT_TYPES
} from './enums/assignment-alert-type.enum';

export const DEFAULT_ASSIGNMENT_ALERT_POLICY: AssignmentAlertPolicyDto = {
  suspensionAlertLimit: 5,
  typingCharactersPerSecondLimit: 20,
  punitiveTypes: [...CONFIGURABLE_ASSIGNMENT_ALERT_TYPES]
};

export interface AssignmentAlertStatus {
  activeCount: number;
  limit: number;
  suspended: boolean;
}

export interface RecordAssignmentAlertResult extends AssignmentAlertStatus {
  recorded: boolean;
  duplicate: boolean;
}

export interface ArchiveAssignmentAlertResult extends AssignmentAlertStatus {
  alertId: number;
  archivedAt: Date;
}

@Injectable()
export class AssignmentAlertService {
  constructor(
    @InjectRepository(AssignmentUserAlert)
    private readonly alertRepository: Repository<AssignmentUserAlert>,
    @InjectRepository(AssignmentAlertRule)
    private readonly ruleRepository: Repository<AssignmentAlertRule>,
    @InjectRepository(Assignment)
    private readonly assignmentRepository: Repository<Assignment>,
    @InjectRepository(UserClass)
    private readonly userClassRepository: Repository<UserClass>,
    private readonly requestContextService: RequestContextService
  ) {}

  async replaceRules(
    assignmentId: number,
    punitiveTypes: AssignmentAlertType[],
    manager?: EntityManager
  ): Promise<void> {
    const repository = manager ? manager.getRepository(AssignmentAlertRule) : this.ruleRepository;

    const configurableTypes = new Set<AssignmentAlertType>(CONFIGURABLE_ASSIGNMENT_ALERT_TYPES);

    const uniqueTypes = [...new Set(punitiveTypes)].filter((type) => configurableTypes.has(type));

    await repository.delete({ assignmentId });

    if (uniqueTypes.length) {
      await repository.save(uniqueTypes.map((type) => repository.create({ assignmentId, type })));
    }
  }

  async decorateAssignments(
    assignments: Assignment[],
    manager?: EntityManager
  ): Promise<Assignment[]> {
    if (!assignments.length) return assignments;

    const ruleRepository = manager ? manager.getRepository(AssignmentAlertRule) : this.ruleRepository;
    const alertRepository = manager ? manager.getRepository(AssignmentUserAlert) : this.alertRepository;

    const assignmentIds = assignments.map((assignment) => assignment.id);

    const rules = await ruleRepository.find({
      where: { assignmentId: In(assignmentIds) },
    });

    const rulesByAssignment = new Map<number, AssignmentAlertType[]>();

    for (const rule of rules) {
      const current = rulesByAssignment.get(rule.assignmentId) ?? [];
      current.push(rule.type);
      rulesByAssignment.set(rule.assignmentId, current);
    }

    const user = this.requestContextService.getUser();
    const countsByAssignment = new Map<number, number>();

    if (user?.userId && !user.isAdmin) {
      const rows = await alertRepository
        .createQueryBuilder('alert')
        .select('alert.assignmentId', 'assignmentId')
        .addSelect('COUNT(alert.id)', 'activeCount')
        .where('alert.assignmentId IN (:...assignmentIds)', { assignmentIds })
        .andWhere('alert.userId = :userId', { userId: user.userId })
        .andWhere('alert.deletedAt IS NULL')
        .groupBy('alert.assignmentId')
        .getRawMany<{ assignmentId: string; activeCount: string }>();

      for (const row of rows) {
        countsByAssignment.set(Number(row.assignmentId), Number(row.activeCount));
      }
    }

    return assignments.map((assignment) => {
      assignment.alertPolicy = {
        suspensionAlertLimit: assignment.suspensionAlertLimit,
        typingCharactersPerSecondLimit: assignment.typingCharactersPerSecondLimit,
        punitiveTypes: rulesByAssignment.get(assignment.id) ?? [],
        version: assignment.alertPolicyVersion,
      };

      if (user?.userId && !user.isAdmin) {
        const activeCount = countsByAssignment.get(assignment.id) ?? 0;
        assignment.currentUserAlertStatus = {
          activeCount,
          limit: assignment.suspensionAlertLimit,
          suspended: activeCount >= assignment.suspensionAlertLimit
        };
      }

      return assignment;
    });
  }

  async getStatus(
    assignmentId: number,
    userId: number
  ): Promise<AssignmentAlertStatus> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id: assignmentId },
      select: { id: true, suspensionAlertLimit: true }
    });

    if (!assignment) throw new NotFoundException('Assignment not found');

    const activeCount = await this.alertRepository.count({
      where: { assignmentId, userId, deletedAt: IsNull() }
    });

    return {
      activeCount,
      limit: assignment.suspensionAlertLimit,
      suspended: activeCount >= assignment.suspensionAlertLimit
    };
  }

  async getCurrentUserStatus(assignmentId: number): Promise<AssignmentAlertStatus> {
    const user = this.requestContextService.getUser();
    if (!user?.userId) throw new ForbiddenException('Authentication required');

    if (!user.isAdmin) {
      const assignment = await this.assignmentRepository.findOne({
        where: { id: assignmentId },
        select: { id: true, classId: true }
      });

      if (!assignment) throw new NotFoundException('Assignment not found');

      await this.assertUserCanAccessAssignment(assignment, user.userId);
    }

    return this.getStatus(assignmentId, user.userId);
  }

  async assertCurrentUserNotSuspended(assignmentId: number): Promise<void> {
    const user = this.requestContextService.getUser();
    if (!user?.userId || user.isAdmin) return;

    const status = await this.getStatus(assignmentId, user.userId);

    if (status.suspended) {
      throw new HttpException(
        {
          statusCode: HttpStatus.LOCKED,
          code: 'ASSIGNMENT_SUSPENDED',
          message: 'User is suspended from this assignment.',
          alertStatus: status
        },
        HttpStatus.LOCKED
      );
    }
  }

  private async assertUserCanAccessAssignment(assignment: Assignment, userId: number): Promise<void> {
    const enrollment = await this.userClassRepository.findOne({
      where: { classId: assignment.classId, userId },
      select: { classId: true, userId: true }
    });

    if (!enrollment) {
      throw new ForbiddenException('User is not enrolled in this class.');
    }
  }

  private sanitizeDetails(dto: CreateAssignmentUserAlertDto): AssignmentAlertDetails | null {

    const details: AssignmentAlertDetails = {};

    if (
      dto.type === AssignmentAlertType.CLIPBOARD &&
      ['copy', 'cut', 'paste'].includes(String(dto.details?.clipboardAction))
    ) {
      details.clipboardAction = dto.details?.clipboardAction;
    }

    if (
      dto.type === AssignmentAlertType.DEVTOOLS &&
      ['shortcut', 'console', 'debugger', 'performance', 'viewport'].includes(
        String(dto.details?.devtoolsSignal),
      )
    ) {
      details.devtoolsSignal = dto.details?.devtoolsSignal;
    }

    if (dto.type === AssignmentAlertType.TYPING_RATE) {
      const measured = dto.measuredCharactersPerSecond ?? dto.details?.measuredCharactersPerSecond;

      if (Number.isInteger(measured) && Number(measured) >= 0) {
        details.measuredCharactersPerSecond = Number(measured);
      }
    }

    return Object.keys(details).length ? details : null;
  }

  async recordCurrentUserAlert(assignmentId: number, dto: CreateAssignmentUserAlertDto): Promise<RecordAssignmentAlertResult> {
    const user = this.requestContextService.getUser();
    if (!user?.userId) throw new ForbiddenException('Authentication required');

    if (user.isAdmin) {
      return {
        recorded: false,
        duplicate: false,
        activeCount: 0,
        limit: 1,
        suspended: false
      };
    }

    const assignment = await this.assignmentRepository.findOne({
      where: { id: assignmentId },
      select: {
        id: true,
        classId: true,
        suspensionAlertLimit: true
      }
    });
    if (!assignment) throw new NotFoundException('Assignment not found');

    await this.assertUserCanAccessAssignment(assignment, user.userId);

    return this.alertRepository.manager.transaction(async (manager) => {

      await manager.query('SELECT pg_advisory_xact_lock($1, $2)', [assignmentId, user.userId]);

      const repository = manager.getRepository(AssignmentUserAlert);

      const duplicate = await repository
        .createQueryBuilder('alert')
        .withDeleted()
        .where('alert.eventId = :eventId', { eventId: dto.eventId })
        .getOne();

      if (duplicate) {
        const status = await this.getStatusWithManager(
          manager,
          assignmentId,
          user.userId,
          assignment.suspensionAlertLimit
        );
        return { recorded: true, duplicate: true, ...status };
      }

      const statusBefore = await this.getStatusWithManager(
        manager,
        assignmentId,
        user.userId,
        assignment.suspensionAlertLimit
      );

      if (statusBefore.suspended) return { recorded: false, duplicate: false, ...statusBefore }

      const ruleExists = await manager
        .getRepository(AssignmentAlertRule)
        .exists({
          where: { assignmentId, type: dto.type }
        });
      if (!ruleExists) return { recorded: false, duplicate: false, ...statusBefore }

      await repository.save(
        repository.create({
          eventId: dto.eventId,
          assignmentId,
          userId: user.userId,
          type: dto.type,
          occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : null,
          details: this.sanitizeDetails(dto)
        })
      );

      const activeCount = statusBefore.activeCount + 1;
      return {
        recorded: true,
        duplicate: false,
        activeCount,
        limit: assignment.suspensionAlertLimit,
        suspended: activeCount >= assignment.suspensionAlertLimit
      };
    });
  }

  private async getStatusWithManager(
    manager: EntityManager,
    assignmentId: number,
    userId: number,
    limit: number
  ): Promise<AssignmentAlertStatus> {

    const activeCount = await manager.getRepository(AssignmentUserAlert).count({
      where: { assignmentId, userId, deletedAt: IsNull() }
    });

    return { activeCount, limit, suspended: activeCount >= limit };
  }

  async listUsers(assignmentId: number, query: ListAssignmentAlertUsersDto) {

    const assignment = await this.assignmentRepository.findOne({
      where: { id: assignmentId },
      select: { id: true, suspensionAlertLimit: true }
    });
    if (!assignment) throw new NotFoundException('Assignment not found');

    const qb = this.alertRepository
      .createQueryBuilder('alert')
      .withDeleted()
      .innerJoin('alert.user', 'user')
      .where('alert.assignmentId = :assignmentId', { assignmentId });

    if (query.status === 'active') qb.andWhere('alert.deletedAt IS NULL');
    if (query.status === 'archived') qb.andWhere('alert.deletedAt IS NOT NULL');
    if (query.search?.trim()) {
      qb.andWhere(
        '(LOWER(user.name) LIKE LOWER(:search) OR LOWER(user.email) LIKE LOWER(:search))',
        {
          search: `%${query.search.trim()}%`
        },
      );
    }

    const totalRow = await qb
      .clone()
      .select('COUNT(DISTINCT alert.userId)', 'total')
      .getRawOne<{ total: string }>();

    const rows = await qb
      .select('alert.userId', 'userId')
      .addSelect('user.name', 'name')
      .addSelect('user.email', 'email')
      .addSelect(
        'COUNT(*) FILTER (WHERE alert.deletedAt IS NULL)',
        'activeCount'
      )
      .addSelect('COUNT(*)', 'totalCount')
      .addSelect('MAX(alert.createdAt)', 'lastAlertAt')
      .groupBy('alert.userId')
      .addGroupBy('user.name')
      .addGroupBy('user.email')
      .orderBy('MAX(alert.createdAt)', 'DESC')
      .offset((query.page - 1) * query.pageSize)
      .limit(query.pageSize)
      .getRawMany();

    const total = Number(totalRow?.total ?? 0);
    return {
      data: rows.map((row) => {
        const activeCount = Number(row.activeCount);
        return {
          userId: Number(row.userId),
          name: row.name,
          email: row.email,
          activeCount,
          totalCount: Number(row.totalCount),
          lastAlertAt: row.lastAlertAt,
          suspended: activeCount >= assignment.suspensionAlertLimit,
          limit: assignment.suspensionAlertLimit
        };
      }),
      meta: {
        total,
        page: query.page,
        pageSize: query.pageSize,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize))
      },
    };
  }

  async listUserHistory(
    assignmentId: number,
    userId: number,
    query: ListAssignmentAlertUsersDto
  ) {
    const where = {
      assignmentId,
      userId,
      ...(query.status === 'active' ? { deletedAt: IsNull() } : {}),
      ...(query.status === 'archived' ? { deletedAt: Not(IsNull()) } : {})
    };

    const [data, total] = await this.alertRepository.findAndCount({
      where,
      withDeleted: true,
      order: { createdAt: 'DESC' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize
    });

    return {
      data,
      meta: {
        total,
        page: query.page,
        pageSize: query.pageSize,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize))
      }
    };
  }

  async archiveAlert(
    assignmentId: number,
    userId: number,
    alertId: number
  ): Promise<ArchiveAssignmentAlertResult> {
    const admin = this.requestContextService.getUser();
    if (!admin?.userId || !admin.isAdmin) throw new ForbiddenException('Administrator access required')

    const assignment = await this.assignmentRepository.findOne({
      where: { id: assignmentId },
      select: { id: true, suspensionAlertLimit: true }
    });
    if (!assignment) throw new NotFoundException('Assignment not found');

    return this.alertRepository.manager.transaction(async (manager) => {
      await manager.query('SELECT pg_advisory_xact_lock($1, $2)', [
        assignmentId,
        userId
      ]);

      const repository = manager.getRepository(AssignmentUserAlert);
      const alert = await repository.findOne({
        where: { id: alertId, assignmentId, userId },
        withDeleted: true
      });
      if (!alert) throw new NotFoundException('Alert not found');

      const archivedAt = alert.deletedAt ?? new Date();
      if (!alert.deletedAt) {
        await repository
          .createQueryBuilder()
          .update(AssignmentUserAlert)
          .set({ deletedAt: archivedAt, archivedByUserId: admin.userId })
          .where('id = :alertId', { alertId })
          .andWhere('assignmentId = :assignmentId', { assignmentId })
          .andWhere('userId = :userId', { userId })
          .andWhere('deletedAt IS NULL')
          .execute();
      }

      const status = await this.getStatusWithManager(
        manager,
        assignmentId,
        userId,
        assignment.suspensionAlertLimit
      );

      return { alertId, archivedAt, ...status };
    });
  }
}
