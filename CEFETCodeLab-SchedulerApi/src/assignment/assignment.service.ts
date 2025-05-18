import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Assignment } from './entities/assignment.entity';
import { DeepPartial, Repository } from 'typeorm';
import { RequestContextService } from 'src/request-context/request-context.service';
import { UserClass } from 'src/user-class/entities/user-class.entity';
import { ClassService } from 'src/class/class.service';
import { AssignmentTemplate } from 'src/assignment_template/entities/assignment_template.entity';
import { AssignmentParam } from 'src/assignment_params/entities/assignment_param.entity';

@Injectable()
export class AssignmentService {
  constructor(
    @InjectRepository(Assignment)
    private readonly assignmentRepository: Repository<Assignment>,
    @InjectRepository(AssignmentTemplate)
    private readonly assignmentTemplateRepository: Repository<AssignmentTemplate>,
    @InjectRepository(AssignmentParam)
    private readonly assignmentParamsRepository: Repository<AssignmentParam>,
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

    // assignmentTemplates
    const newAssignment = await this.assignmentRepository.save(createAssignmentDto);

    if (createAssignmentDto.templates && createAssignmentDto.templates.length > 0) {
      const assignmentTemplateEntities = createAssignmentDto.templates.map((template) => ({
        assignmentId: newAssignment.id,
        templateId: template.templateId,
      }));

      const assignmentParamsEntities = createAssignmentDto.templates.flatMap((template) =>
        template.params.map((param) => ({
          assignmentId: newAssignment.id,
          templateParamsId: param.templateParamId,
          value: param.value,
        })),
      );
      
      console.log('assignmentParamsEntities: ', assignmentParamsEntities)
      await this.assignmentTemplateRepository.save(assignmentTemplateEntities);
      await this.assignmentParamsRepository.save(assignmentParamsEntities);
    }
  
    return newAssignment;
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
      relations: ['assignmentAttempts', 'class', 'class.userClasses', 'assignmentTemplates', 'assignmentTemplates.template', 'assignmentTemplates.template.templateParams'],
      where,
    });

    return response;
  }

  async update(id: number, updateAssignmentDto: UpdateAssignmentDto) {
    const { templates, ...dataToUpdate } = updateAssignmentDto;

    const assignment = await this.assignmentRepository.findOne({ where: { id } });

    if (!assignment) {
      throw new NotFoundException('Tarefa não encontrada');
    }

    await this.assignmentRepository.update(id, dataToUpdate);

    if (updateAssignmentDto.templates && updateAssignmentDto.templates.length > 0) {
      await this.assignmentTemplateRepository.delete({ assignmentId: id });
      await this.assignmentParamsRepository.delete({ assignmentId: id });
  
      const assignmentTemplateEntities = updateAssignmentDto.templates.map((template) => ({
        assignmentId: id,
        templateId: template.templateId,
      }));
  
      const assignmentParamsEntities = updateAssignmentDto.templates.flatMap((template) =>
        template.params.map((param) => ({
          assignmentId: id,
          templateParamsId: param.templateParamId,
          value: param.value,
        })),
      );
  
      await this.assignmentTemplateRepository.save(assignmentTemplateEntities);
      await this.assignmentParamsRepository.save(assignmentParamsEntities);
    }
  
    return this.assignmentRepository.findOne({ where: { id } });
  }

  remove(id: number) {
    return this.assignmentRepository.delete({ id });
  }
}
