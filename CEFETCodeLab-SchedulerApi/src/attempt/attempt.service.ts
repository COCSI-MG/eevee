import { Injectable } from '@nestjs/common';
import { CreateAttemptDto } from './dto/create-applicant-attempt.dto';
import { UpdateApplicantAttemptDto } from './dto/update-applicant-attempt.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Attempt } from './entities/attempt.entity';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class AttemptService {
  constructor(
    @InjectRepository(Attempt)
    private readonly attemptRepository: Repository<Attempt>,
    private readonly clsService: ClsService,
  ) {}
  create(createAttemptDto: CreateAttemptDto) {
    const user = this.clsService.get('user');

    return this.attemptRepository.save({
      ...createAttemptDto,
      userId: user.userId,
    });
  }

  findAllByAssignmentAndCurrentUser(assignmentId: number) {
    const user = this.clsService.get('user');

    return this.attemptRepository.find({
      where: {
        userId: user.userId,
        assignmentId,
      },
    });
  }
}
