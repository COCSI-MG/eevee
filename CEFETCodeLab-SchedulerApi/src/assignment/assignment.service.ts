import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Assignment } from './entities/assignment.entity';
import { DeepPartial, Repository } from 'typeorm';
import { RequestContextService } from 'src/request-context/request-context.service';
import { UserClass } from 'src/user-class/entities/user-class.entity';
import { ClassService } from 'src/class/class.service';

@Injectable()
export class AssignmentService {
  constructor(
    @InjectRepository(Assignment)
    private readonly assignmentRepository: Repository<Assignment>,
    @InjectRepository(UserClass)
    private readonly userClassRepository: Repository<UserClass>,
    private readonly classservice: ClassService,
    private readonly requestContextService: RequestContextService,
  ) {}
  async create(createAssignmentDto: CreateAssignmentDto) {
    const classExists = await this.classservice.findOne(createAssignmentDto.classId);

    if (!classExists) {
      throw new NotFoundException(`Class with id ${createAssignmentDto.classId} not found`);
    }

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

  async findAssignmentsByClass(classId: number) {
    const user = this.requestContextService.getUser();
    
    if (!user.isAdmin) {
      const isUserInClass = await this.userClassRepository.findOne({
        where: {
          userId: user.userId,
          classId,
        },
      });
  
      if (!isUserInClass) {
        throw new ForbiddenException('You are not authorized to access this class.');
      }
    }
   
    return this.assignmentRepository.find({
      where: { classId },
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
    return this.assignmentRepository.delete({ id });
  }
}
