import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateAttemptDto } from './dto/create-applicant-attempt.dto';
import { Brackets, LessThan, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Attempt } from './entities/attempt.entity';
import { ClsService } from 'nestjs-cls';
import { AttemptStatus } from './enums/attempt-status.enum';
import { UpdateApplicantAttemptDto } from './dto/update-applicant-attempt.dto';
import { Cron } from '@nestjs/schedule';
import { ListAdminAttemptsQueryDto } from './dto/list-admin-attempts.query.dto';

@Injectable()
export class AttemptService {
  private readonly logger = new Logger(AttemptService.name);

  constructor(
    @InjectRepository(Attempt)
    private readonly attemptRepository: Repository<Attempt>,
    private readonly clsService: ClsService,
  ) { }

  async isUserAbleToAttemptAssignment(assignmentId: number): Promise<boolean> {
    const attempts = await this.findAllByAssignmentAndCurrentUser(assignmentId);
    if (attempts.length === 0) return true;

    this.logger.debug(attempts);

    // get assignment from first attempt
    const assignment = attempts[0].assignment;
    if (assignment.maxAttempts <= attempts.length) {
      return false;
    }

    if (attempts.some((attempt) => attempt.status === AttemptStatus.RUNNING)) {
      return false;
    }

    return true;
  }

  async isUserWithAssignmentRunningAttempt(
    assignmentId: number,
  ): Promise<boolean> {
    const user = this.clsService.get('user');
    const attempts = await this.attemptRepository.exists({
      where: {
        userId: user.userId,
        assignmentId,
        status: AttemptStatus.RUNNING,
      },
    });
    return attempts;
  }

  async create(createAttemptDto: CreateAttemptDto) {
    const user = this.clsService.get('user');
    return this.attemptRepository.save({
      ...createAttemptDto,
      userId: user.userId,
    });
  }

  async createForUser(createAttemptDto: CreateAttemptDto, userId: number) {
    return this.attemptRepository.save({
      ...createAttemptDto,
      userId,
    });
  }

  async getNextAttemptNumber(assignmentId: number, userId: number) {
    const result = await this.attemptRepository
      .createQueryBuilder('attempt')
      .select('COALESCE(MAX(attempt.attempt), 0)', 'maxAttempt')
      .where('attempt.assignmentId = :assignmentId', { assignmentId })
      .andWhere('attempt.userId = :userId', { userId })
      .getRawOne<{ maxAttempt: string }>();

    const maxAttempt = Number(result?.maxAttempt ?? 0);
    return maxAttempt + 1;
  }

  async findAllForAdmin(query: ListAdminAttemptsQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const skip = (page - 1) * pageSize;

    const baseQb = this.attemptRepository
      .createQueryBuilder('attempt')
      .leftJoin('attempt.user', 'user')
      .leftJoin('attempt.assignment', 'assignment')
      .where('attempt.assignmentId = :assignmentId', {
        assignmentId: query.assignmentId,
      })

    if (query.userSearch?.trim()) {
      const userSearch = query.userSearch.trim();
      baseQb.andWhere(
        new Brackets((expr) => {
          expr.where('LOWER(user.email) LIKE LOWER(:userEmail)', {
            userEmail: `%${userSearch}%`,
          });

          const parsedId = Number(userSearch);
          if (!Number.isNaN(parsedId)) {
            expr.orWhere('user.id = :userId', { userId: parsedId });
          }
        }),
      );
    }

    const rows = await baseQb
      .clone()
      .select([
        'attempt.id AS attempt_id',
        'attempt.attempt AS attempt_attempt',
        'attempt.userId AS attempt_userId',
        'attempt.assignmentId AS attempt_assignmentId',
        'attempt.status AS attempt_status',
        'attempt.isAcceptable AS attempt_isAcceptable',
        'attempt.score AS attempt_score',
        'attempt.passes AS attempt_passes',
        'attempt.fails AS attempt_fails',
        'attempt.createdAt AS attempt_createdAt',
        'user.id AS user_id',
        'user.name AS user_name',
        'user.email AS user_email',
        'user.isAdmin AS user_isAdmin',
        'assignment.id AS assignment_id',
        'assignment.title AS assignment_title',
        'assignment.description AS assignment_description',
        'assignment.workerType AS assignment_workerType',
      ])
      .orderBy('attempt.createdAt', 'DESC')
      .offset(skip)
      .limit(pageSize)
      .getRawMany();

    const total = await baseQb.clone().getCount();

    const data = rows.map((row) => ({
      id: Number(row.attempt_id),
      attempt: Number(row.attempt_attempt),
      userId: Number(row.attempt_userid ?? row.attempt_userId),
      assignmentId: Number(
        row.attempt_assignmentid ?? row.attempt_assignmentId,
      ),
      status: row.attempt_status,
      isAcceptable: Boolean(row.attempt_isacceptable ?? row.attempt_isAcceptable),
      score: Number(row.attempt_score),
      passes: Number(row.attempt_passes),
      fails: Number(row.attempt_fails),
      createdAt: row.attempt_createdat ?? row.attempt_createdAt,
      user: {
        id: Number(row.user_id),
        name: row.user_name,
        email: row.user_email,
        isAdmin: Boolean(row.user_isadmin ?? row.user_isAdmin),
      },
      assignment: {
        id: Number(row.assignment_id),
        title: row.assignment_title,
        description: row.assignment_description,
        workerType: row.assignment_workertype ?? row.assignment_workerType,
      },
    }));

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return {
      data,
      meta: {
        total,
        page,
        pageSize,
        totalPages,
      },
    };
  }

  findOneForAdmin(id: number) {
    return this.attemptRepository
      .createQueryBuilder('attempt')
      .leftJoin('attempt.user', 'user')
      .leftJoin('attempt.assignment', 'assignment')
      .where('attempt.id = :id', { id })
      .select([
        'attempt.id AS attempt_id',
        'attempt.attempt AS attempt_attempt',
        'attempt.userId AS attempt_userId',
        'attempt.assignmentId AS attempt_assignmentId',
        'attempt.status AS attempt_status',
        'attempt.isAcceptable AS attempt_isAcceptable',
        'attempt.score AS attempt_score',
        'attempt.passes AS attempt_passes',
        'attempt.fails AS attempt_fails',
        'attempt.receivedWork AS attempt_receivedWork',
        'attempt.report AS attempt_report',
        'attempt.createdAt AS attempt_createdAt',
        'user.id AS user_id',
        'user.name AS user_name',
        'user.email AS user_email',
        'user.isAdmin AS user_isAdmin',
        'assignment.id AS assignment_id',
        'assignment.title AS assignment_title',
        'assignment.description AS assignment_description',
        'assignment.workerType AS assignment_workerType',
      ])
      .getRawOne()
      .then((row) => {
        if (!row) return null;

        return {
          id: Number(row.attempt_id),
          attempt: Number(row.attempt_attempt),
          userId: Number(row.attempt_userid ?? row.attempt_userId),
          assignmentId: Number(
            row.attempt_assignmentid ?? row.attempt_assignmentId,
          ),
          status: row.attempt_status,
          isAcceptable: Boolean(
            row.attempt_isacceptable ?? row.attempt_isAcceptable,
          ),
          score: Number(row.attempt_score),
          passes: Number(row.attempt_passes),
          fails: Number(row.attempt_fails),
          receivedWork: row.attempt_receivedwork ?? row.attempt_receivedWork,
          report: row.attempt_report,
          createdAt: row.attempt_createdat ?? row.attempt_createdAt,
          user: {
            id: Number(row.user_id),
            name: row.user_name,
            email: row.user_email,
            isAdmin: Boolean(row.user_isadmin ?? row.user_isAdmin),
          },
          assignment: {
            id: Number(row.assignment_id),
            title: row.assignment_title,
            description: row.assignment_description,
            workerType:
              row.assignment_workertype ?? row.assignment_workerType,
          },
        };
      });
  }

  findAllByAssignmentAndCurrentUser(assignmentId: number) {
    const user = this.clsService.get('user');
    return this.attemptRepository.find({
      relations: [
        "assignment"
      ],
      where: {
        userId: user.userId,
        assignmentId,
      },
      cache: {
        id: `attempts-assignment-${assignmentId}-user-${user.userId}`,
        milliseconds: 1000 * 60 * 5, // 5 minutes cache
      },
    });
  }

  findOne(id: number) {
    return this.attemptRepository.findOne({
      where: { id },
      relations: [
        'assignment',
        'user',
        'assignment.assignmentTemplates',
        'assignment.assignmentTemplates.template',
        'assignment.assignmentTemplates.template.templateParams',
        'assignment.assignmentParams',
      ],
      cache: {
        id: `attempt-${id}`,
        milliseconds: 1000 * 60 * 5, // 5 minutes cache
      },
    });
  }

  async findRefinedReport(id: number, userId: number): Promise<string | null> {
    const attempt = await this.attemptRepository
      .createQueryBuilder('attempt')
      .select(['attempt.id', 'attempt.refinedReport'])
      .where('attempt.id = :id', { id })
      .andWhere('attempt.userId = :userId', { userId })
      .getOne();

    if (!attempt) throw new NotFoundException('Attempt not found');
    return attempt.refinedReport ?? null;
  }

  update(updateAttemptDto: UpdateApplicantAttemptDto) {
    return this.attemptRepository.update(updateAttemptDto.id, {
      ...updateAttemptDto,
    });
  }

  @Cron('*/5 * * * *') // Every 5 minutes
  async checkForZombiesAttempts() {
    this.logger.log('Checking for zombie attempts...');

    try {
      const attempts = await this.attemptRepository.find({
        where: {
          status: AttemptStatus.RUNNING,
          createdAt: LessThan(new Date(Date.now() - 10 * 60 * 1000)),
        },
        relations: ['assignment'],
      });
      if (attempts.length === 0) {
        this.logger.log('No zombie attempts found.');
        return;
      }

      await this.attemptRepository
        .createQueryBuilder()
        .update(Attempt)
        .set({ status: AttemptStatus.FAILED })
        .where('id IN (:...ids)', { ids: attempts.map((a) => a.id) })
        .execute();
    } catch (error) {
      this.logger.error('Error checking for zombie attempts:', error);
      throw error;
    }
  }
}
