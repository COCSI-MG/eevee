import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Assignment } from 'src/assignment/entities/assignment.entity';
import { Attempt } from 'src/attempt/entities/attempt.entity';
import { RequestContextService } from 'src/request-context/request-context.service';
import { Repository } from 'typeorm';
import { CreateInterviewResponseDto } from './dto/create-interview-response.dto';
import { InterviewResponse } from './entities/interview-response.entity';

@Injectable()
export class InterviewResponseService {
  constructor(
    @InjectRepository(InterviewResponse)
    private readonly interviewResponseRepository: Repository<InterviewResponse>,
    @InjectRepository(Assignment)
    private readonly assignmentRepository: Repository<Assignment>,
    @InjectRepository(Attempt)
    private readonly attemptRepository: Repository<Attempt>,
    private readonly requestContextService: RequestContextService,
  ) {}

  private async assertAssignmentExists(assignmentId: number): Promise<void> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id: assignmentId },
      select: { id: true },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }
  }

  private async assertAttemptOwnership(options: {
    attemptId: number;
    assignmentId: number;
    userId: number;
  }): Promise<void> {
    const { attemptId, assignmentId, userId } = options;

    const attempt = await this.attemptRepository.findOne({
      where: { id: attemptId },
      select: { id: true, assignmentId: true, userId: true },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    if (attempt.assignmentId !== assignmentId) {
      throw new ForbiddenException(
        'Attempt does not belong to the provided assignment',
      );
    }

    if (attempt.userId !== userId) {
      throw new ForbiddenException('Attempt does not belong to current user');
    }
  }

  async upsert(dto: CreateInterviewResponseDto) {
    const user = this.requestContextService.getUser();
    if (!user?.userId) {
      throw new ForbiddenException('Authentication required');
    }

    await this.assertAssignmentExists(dto.assignmentId);

    if (dto.attemptId) {
      await this.assertAttemptOwnership({
        attemptId: dto.attemptId,
        assignmentId: dto.assignmentId,
        userId: user.userId,
      });
    }

    const existing = await this.interviewResponseRepository.findOne({
      where: {
        assignmentId: dto.assignmentId,
        userId: user.userId,
      },
    });

    const payload = {
      ...dto,
      userId: user.userId,
      updatedAt: new Date(),
    };

    if (!existing) {
      const created = this.interviewResponseRepository.create(payload);
      return this.interviewResponseRepository.save(created);
    }

    await this.interviewResponseRepository.update(existing.id, payload);
    return this.interviewResponseRepository.findOne({
      where: { id: existing.id },
    });
  }

  async findMineByAssignmentId(assignmentId: number) {
    const user = this.requestContextService.getUser();
    if (!user?.userId) {
      throw new ForbiddenException('Authentication required');
    }

    return this.interviewResponseRepository.findOne({
      where: {
        assignmentId,
        userId: user.userId,
      },
      order: { id: 'DESC' },
    });
  }

  async listByAssignmentForAdmin(assignmentId: number) {
    return this.interviewResponseRepository.find({
      where: { assignmentId },
      relations: ['user', 'attempt'],
      order: { id: 'DESC' },
    });
  }
}
