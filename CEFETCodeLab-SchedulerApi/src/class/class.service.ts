import { ForbiddenException, Injectable, UnprocessableEntityException, UseGuards } from '@nestjs/common';
import { CreateOrReplaceClassDto } from './dto/request/create-or-replace-class.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Class } from './entities/class.entity';
import { Repository } from 'typeorm';
import { ClassHelper } from './class.helper';
import { UserClassService } from 'src/user-class/user-class.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RequestContextService } from 'src/request-context/request-context.service';

@Injectable()
@UseGuards(JwtAuthGuard)
export class ClassService {
  constructor(
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
    private readonly userClassService: UserClassService,
    private readonly requestContextService: RequestContextService,
  ) { }

  async createOrReplace(createClassDto: CreateOrReplaceClassDto) {
    let newIdentifier: Class;
    if (createClassDto.id) {
      const existingClass = await this.classRepository.findOne({
        where: { id: createClassDto.id },
      });
      if (!existingClass) {
        throw new UnprocessableEntityException('Class not found.');
      }

      await this.classRepository.update(createClassDto.id, {
        name: createClassDto.name,
        description: createClassDto.description,
      });

      await this.userClassService.deleteByClassId(createClassDto.id);

      const updatedClass = {
        ...existingClass,
        ...{
          name: createClassDto.name,
          description: createClassDto.description,
        },
      };

      newIdentifier = updatedClass;
    } else {
      const newClass = this.classRepository.create({
        name: createClassDto.name,
        description: createClassDto.description,
      });
      const savedClass = await this.classRepository.save(newClass);
      newIdentifier = savedClass; 
    }

    if (createClassDto.students) {
      await this.userClassService.createMany(
        createClassDto.students.map((user) => ({
          userId: user,
          classId: newIdentifier.id,
        })),
      );
    }

    const response = ClassHelper.toResponseDto(newIdentifier);
    return response;
  }

  async findAll() {
    return (
      await this.classRepository.find({
        relations: ['userClasses', 'userClasses.user', 'userClasses.class'],
      })
    ).map(ClassHelper.toResponseDto);
  }

  async findAllByUser(userId: number) {
    const user = this.requestContextService.getUser();

    if (user.userId !== userId && !user.isAdmin) {
      throw new ForbiddenException(
        'You are not authorized to access classes of other users.',
      );
    }

    return await this.classRepository.find({
      relations: [
        'userClasses',
        'userClasses.user',
        'userClasses.class',
        'assignments',
      ],
      where: {
        userClasses: {
          user: { id: userId },
        },
      },
    });
  }

  findOne(id: number) {
    return this.classRepository.findOne({
      where: { id },
      relations: ['userClasses', 'userClasses.user', 'userClasses.class'],
    });
  }

  remove(id: number) {
    return this.classRepository.delete({ id });
  }
}
