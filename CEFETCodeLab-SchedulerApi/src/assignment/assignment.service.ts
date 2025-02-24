import { Injectable } from '@nestjs/common';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Assignment } from './entities/assignment.entity';
import { DeepPartial, Repository } from 'typeorm';
import { RequestContextService } from 'src/request-context/request-context.service';

@Injectable()
export class AssignmentService {
  constructor(
    @InjectRepository(Assignment)
    private readonly assignmentRepository: Repository<Assignment>,
    private readonly requestContextService: RequestContextService,
  ) {}
  create(createAssignmentDto: CreateAssignmentDto) {
    return this.assignmentRepository.save(createAssignmentDto);
  }

  findAllUserAssignments() {
    const user = this.requestContextService.getUser();

    return this.assignmentRepository.find({
      relations: [
        'assignmentAttempts',
        'class',
        'class.userClasses',
        'class.userClasses.user',
      ],
      where: {
        class: {
          userClasses: {
            userId: user.userId,
          },
        },
      },
    });
  }

  findAll() {
    return this.assignmentRepository.find({
      relations: ['assignmentAttempts', 'class', 'class.userClasses'],
    });
  }

  async findOne(id: number) {
    const { isAdmin, userId } = this.requestContextService.getUser();

    const where: { id: number; class?: { userClasses: { userId: number } } } = {
      id,
      class: {
        userClasses: { userId: this.requestContextService.getUser().userId },
      },
    };

    if (isAdmin) {
      delete where.class;
    }

    const response = await this.assignmentRepository.findOne({
      relations: ['assignmentAttempts', 'class', 'class.userClasses'],
      where,
    });

    console.log(response);
    return response;
  }

  update(id: number, updateAssignmentDto: UpdateAssignmentDto) {
    return this.assignmentRepository.update(id, updateAssignmentDto);
  }

  remove(id: number) {
    return `This action removes a #${id} assignment`;
  }
}
