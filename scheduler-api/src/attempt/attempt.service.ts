import { Injectable, Logger } from '@nestjs/common';
import { CreateAttemptDto } from './dto/create-applicant-attempt.dto';
import { LessThan, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Attempt } from './entities/attempt.entity';
import { ClsService } from 'nestjs-cls';
import { AttemptStatus } from './enums/attempt-status.enum';
import { UpdateApplicantAttemptDto } from './dto/update-applicant-attempt.dto';
import { Cron } from '@nestjs/schedule';

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
