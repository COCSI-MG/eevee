import { ForbiddenException, Injectable, UseGuards } from '@nestjs/common';
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
     private readonly requestContextService: RequestContextService
  ) {}
  async createOrReplace(createClassDto: CreateOrReplaceClassDto) {
    if (createClassDto.id) {
      const existingClass = await this.findOne(createClassDto.id);
      if (!existingClass) {
        delete createClassDto.id;
      }
    }

    const result = await this.classRepository.upsert(createClassDto, {
      conflictPaths: ['id'],
      skipUpdateIfNoValuesChanged: true,
      upsertType: 'on-conflict-do-update',
    });

    const [newIdentifier] = result.identifiers;

    if (createClassDto.students) {
      await this.userClassService.createMany(
        createClassDto.students.map((user) => ({
          userId: user,
          classId: newIdentifier.id,
        })),
      );
    }

    const newclass = (await this.findOne(newIdentifier.id))!;

    const response = ClassHelper.toResponseDto(newclass);

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
      throw new ForbiddenException('You are not authorized to access classes of other users.');
    }

    return (
      await this.classRepository.find({
        relations: ['userClasses', 'userClasses.user', 'userClasses.class'],
        where: {
          userClasses: {
            user: { id: userId },
          },
        },
      })
    )
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
