import { Injectable } from '@nestjs/common';
import { CreateAssignmentUserSuspensionDto } from './dto/create-assignment-user-suspension.dto';
import { UpdateAssignmentUserSuspensionDto } from './dto/update-assignment-user-suspension.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { AssignmentUserSuspension } from './entities/assignment-user-suspension.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AssignmentUserSuspensionService {
  constructor(
    @InjectRepository(AssignmentUserSuspension)
    private readonly assignmentUserSuspensionRepository: Repository<AssignmentUserSuspension>,
  ) {}

  async isUserSuspendedFromAssignment(
    userId: number,
    assignmentId: number,
  ): Promise<boolean> {
    const suspension = await this.assignmentUserSuspensionRepository.findOne({
      where: {
        userId,
        assignmentId,
        isActive: true,
      },
    });
    return !!suspension;
  }

  async suspendUserFromAssignment(
    userId: number,
    assignmentId: number,
    reason?: string,
  ): Promise<AssignmentUserSuspension> {
    const suspension = this.assignmentUserSuspensionRepository.create({
      userId,
      assignmentId,
      reason,
    });
    return this.assignmentUserSuspensionRepository.save(suspension);
  }

  async removeSuspensionFromAssignment(
    userId: number,
    assignmentId: number,
  ): Promise<void> {
    await this.assignmentUserSuspensionRepository.update(
      { userId, assignmentId, isActive: true },
      { isActive: false, updatedAt: new Date() },
    );
  }

  async getSuspensionsByAssignmentId(
    assignmentId: number,
  ): Promise<AssignmentUserSuspension[]> {
    return this.assignmentUserSuspensionRepository.find({
      where: { assignmentId, isActive: true },
      relations: ['user'],
    });
  }

  create(createAssignmentUserSuspensionDto: CreateAssignmentUserSuspensionDto) {
    return this.suspendUserFromAssignment(
      createAssignmentUserSuspensionDto.userId!,
      createAssignmentUserSuspensionDto.assignmentId,
      createAssignmentUserSuspensionDto.reason,
    );
  }

  findAll() {
    return `This action returns all assignmentUserSuspension`;
  }

  findOne(id: number) {
    return this.assignmentUserSuspensionRepository.findOne({
      where: { id },
      relations: ['user', 'assignment'],
    });
  }

  update(
    id: number,
    updateAssignmentUserSuspensionDto: UpdateAssignmentUserSuspensionDto,
  ) {
    return `This action updates a #${id} assignmentUserSuspension`;
  }

  remove(id: number) {
    return this.assignmentUserSuspensionRepository.delete(id);
  }
}
