import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Assignment } from 'src/assignment/entities/assignment.entity';
import { AnswerKey } from './entities/answer-key.entity';
import { CreateAnswerKeyDto } from './dto/create-answer-key.dto';
import { UpdateAnswerKeyDto } from './dto/update-answer-key.dto';
import { AssignmentAlertService } from 'src/assignment-alert/assignment-alert.service';
import { UserRole } from 'src/user/user-role';
import { ClassAccessService } from 'src/auth/class-access.service';

@Injectable()
export class AnswerKeyService {
  constructor(
    @InjectRepository(AnswerKey)
    private readonly answerKeyRepository: Repository<AnswerKey>,
    @InjectRepository(Assignment)
    private readonly assignmentRepository: Repository<Assignment>,
    private readonly dataSource: DataSource,
    private readonly assignmentAlertService: AssignmentAlertService,
    private readonly classAccess: ClassAccessService
  ) {}

  async create(assignmentId: number, dto: CreateAnswerKeyDto) {
    const assignment = await this.classAccess.assertAssignmentAccess(assignmentId, true);

    if (!assignment) throw new NotFoundException('Assignment not found');

    const existing = await this.answerKeyRepository.findOne({
      where: { assignmentId }
    });

    if (existing || assignment.answerKeyId) {
      throw new ConflictException('Assignment already has an answer key');
    }

    try {
      return await this.dataSource.transaction(async (manager) => {
        const answerKey = await manager.save(AnswerKey, {
          assignmentId,
          content: dto.content,
        });

        await manager.update(Assignment, assignmentId, {
          answerKeyId: answerKey.id,
        });

        return answerKey;
      });
    } catch (error) {
      if ((error as { code?: string }).code === '23505') {
        throw new ConflictException('Assignment already has an answer key');
      }
      throw error;
    }
  }

  async findOne(assignmentId: number, role: UserRole) {
    await this.classAccess.assertAssignmentAccess(assignmentId);
    const canManage = role === UserRole.ADMIN || role === UserRole.TEACHER;

    if (!canManage) {
      await this.assignmentAlertService.assertCurrentUserNotSuspended(assignmentId);
    }

    const answerKey = await this.answerKeyRepository.findOne({
      where: { assignmentId },
    });

    if (!answerKey) throw new NotFoundException('Answer key not found');

    const assignment = await this.assignmentRepository.findOne({
      where: { id: assignmentId },
      select: { id: true, answerKeyVisible: true },
    });

    if (!assignment) throw new NotFoundException('Assignment not found');

    if (!canManage && !assignment.answerKeyVisible) {
      throw new ForbiddenException('Answer key is not visible');
    }

    return answerKey;
  }

  async update(assignmentId: number, dto: UpdateAnswerKeyDto) {
    await this.classAccess.assertAssignmentAccess(assignmentId, true);
    const answerKey = await this.answerKeyRepository.findOne({
      where: { assignmentId },
    });

    if (!answerKey) throw new NotFoundException('Answer key not found');

    return this.dataSource.transaction(async (manager) => {
      if (dto.content) {
        answerKey.content = dto.content;
      }

      const updated = await manager.save(AnswerKey, answerKey);

      await manager.update(Assignment, assignmentId, {
        answerKeyId: answerKey.id,
      });

      return updated;
    });
  }

  async remove(assignmentId: number) {
    await this.classAccess.assertAssignmentAccess(assignmentId, true);
    return this.dataSource.transaction(async (manager) => {
      const answerKey = await manager.findOne(AnswerKey, {
        where: { assignmentId },
      });

      if (!answerKey) throw new NotFoundException('Answer key not found');

      await manager.update(Assignment, assignmentId, {
        answerKeyId: null,
        answerKeyVisible: false,
      });

      await manager.delete(AnswerKey, answerKey.id);

      return { deleted: true };
    });
  }
}
