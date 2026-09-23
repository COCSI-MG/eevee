import { ForbiddenException, Injectable, UnprocessableEntityException, UseGuards } from '@nestjs/common';
import { CreateOrReplaceClassDto } from './dto/request/create-or-replace-class.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Class } from './entities/class.entity';
import { Brackets, Repository } from 'typeorm';
import { ClassHelper } from './class.helper';
import { UserClassService } from 'src/user-class/user-class.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RequestContextService } from 'src/request-context/request-context.service';
import { BaseClassDto } from './dto/base-class.dto';
import { ListClassesQueryDto } from './dto/request/list-classes.query.dto';
import {
  PaginatedResult,
  buildPaginationMeta,
  buildPaginationParams,
} from 'src/common/pagination/pagination';
import { ClassResponseDto } from './dto/response/class-response.dto';

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

  async update(id: number, updateClassDto: CreateOrReplaceClassDto) {
    updateClassDto.id = id;

    if (updateClassDto.id) {
      const existingClass = await this.findOne(updateClassDto.id);

      if (!existingClass) {
        throw new ForbiddenException(`Class with id ${id} does not exist.`);
      }
    }

    const entity: BaseClassDto = { ...updateClassDto, id };

    await this.classRepository.update({ id }, ClassHelper.toEntity(entity));

    await this.updateEffects(id, updateClassDto);

    const newclass = (await this.findOne(id))!;
    const response = ClassHelper.toResponseDto(newclass);

    return response;
  }

  private async updateEffects(
    id: number,
    updateClassDto: CreateOrReplaceClassDto,
  ) {
    if (updateClassDto.students) {
      await this.userClassService.createMany(
        updateClassDto.students.map((user) => ({
          userId: user,
          classId: id,
        })),
      );
    }
  }

  async findAll() {
    return (
      await this.classRepository.find({
        relations: ['userClasses', 'userClasses.user', 'userClasses.class'],
      })
    ).map(ClassHelper.toResponseDto);
  }

  findOptions() {
    return this.classRepository.find({
      select: {
        id: true,
        name: true
      },
      order: {
        name: 'ASC',
        id: 'ASC'
      },
    });
  }

  async findAllPaginated(query: ListClassesQueryDto): Promise<PaginatedResult<ClassResponseDto>> {
    const { page, pageSize, skip } = buildPaginationParams(query);

    const qb = this.classRepository
      .createQueryBuilder('class')
      .leftJoinAndSelect('class.userClasses', 'userClasses')
      .leftJoinAndSelect('userClasses.user', 'user')
      .leftJoinAndSelect('userClasses.class', 'innerClass')
      .orderBy('class.id', 'DESC');

    const search = query.search?.trim();
    if (search) {
      qb.andWhere(
        new Brackets((expr) => {
          expr
            .where('LOWER(class.name) LIKE LOWER(:search)', { search: `%${search}%` })
            .orWhere('LOWER(class.description) LIKE LOWER(:search)', { search: `%${search}%` });
        }),
      );
    }

    const [rows, total] = await qb.clone().skip(skip).take(pageSize).getManyAndCount();
    const data = rows.map(ClassHelper.toResponseDto);

    return { data, meta: buildPaginationMeta(total, page, pageSize) };
  }

  async findAllByUser(userId: number) {
    const user = this.requestContextService.getUser();

    if (user.userId !== userId && !user.isAdmin) {
      throw new ForbiddenException(
        'You are not authorized to access classes of other users.',
      );
    }

    const classes = await this.classRepository.find({
      relations: [
        'userClasses',
        'userClasses.user',
        'userClasses.class',
        'assignments',
      ],
      ...(user.isAdmin
        ? {}
        : {
            where: {
              userClasses: {
                user: { id: userId },
              },
            },
          }),
    });
    if (!classes.length) return [];
    const counts: { id: number; exams: number; practices: number; quizzes: number }[] =
      await this.classRepository.query(
        `SELECT c.id,
          (SELECT count(*)::int FROM exam e WHERE e."classId"=c.id
            AND ($2::boolean OR (e."startDate" IS NOT NULL AND e."startDate" <= $3))) AS exams,
          (SELECT count(*)::int FROM learning_activity a WHERE a."classId"=c.id AND a.kind='practice'
            AND ($2::boolean OR (a.published AND (a."startDate" IS NULL OR a."startDate" <= $3)))) AS practices,
          (SELECT count(*)::int FROM learning_activity a WHERE a."classId"=c.id AND a.kind='quiz'
            AND ($2::boolean OR (a.published AND (a."startDate" IS NULL OR a."startDate" <= $3)))) AS quizzes
         FROM "class" c WHERE c.id = ANY($1::int[])`,
        [classes.map((group) => group.id), !!user.isAdmin, new Date()],
      );
    const byClass = new Map(counts.map(({ id, ...summary }) => [id, summary]));
    return classes.map((group) => ({
      ...group,
      activityCounts: byClass.get(group.id) ?? { exams: 0, practices: 0, quizzes: 0 },
    }));
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
