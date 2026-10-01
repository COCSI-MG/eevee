import { UserRole } from 'src/user/user-role';
import { ForbiddenException, Injectable, NotFoundException, UnprocessableEntityException, UseGuards } from '@nestjs/common';
import { CreateOrReplaceClassDto } from './dto/request/create-or-replace-class.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Class } from './entities/class.entity';
import { Brackets, In, Repository } from 'typeorm';
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
import { User } from 'src/user/entities/user.entity';
import { ClassAccessService } from 'src/auth/class-access.service';

@Injectable()
@UseGuards(JwtAuthGuard)
export class ClassService {
  constructor(
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly userClassService: UserClassService,
    private readonly requestContextService: RequestContextService,
    private readonly classAccess: ClassAccessService
  ) { }

  async createOrReplace(createClassDto: CreateOrReplaceClassDto) {
    const currentUser = this.requestContextService.getUser();

    if (createClassDto.students) await this.assertStudents(createClassDto.students);

    if (currentUser.role === UserRole.ADMIN && createClassDto.teacherId != null) {
      await this.assertTeacher(createClassDto.teacherId);
    }

    let newIdentifier: Class;

    if (createClassDto.id) {

      const existingClass = await this.classAccess.assertClassAccess(createClassDto.id, true);

      if (createClassDto.teacherId !== undefined && currentUser.role !== UserRole.ADMIN) {
        throw new ForbiddenException('Only admins can change the class teacher.');
      }

      await this.classRepository.update(createClassDto.id, {
        name: createClassDto.name,
        description: createClassDto.description,
        ...(createClassDto.teacherId !== undefined ? { teacherId: createClassDto.teacherId } : {}),
      });

      if (createClassDto.students) {
        await this.userClassService.deleteByClassId(createClassDto.id);
      }

      const updatedClass = {
        ...existingClass,
        ...{
          name: createClassDto.name,
          description: createClassDto.description,
          teacherId: createClassDto.teacherId !== undefined ? createClassDto.teacherId : existingClass.teacherId,
        },
      };

      newIdentifier = updatedClass;
    } else {
      const newClass = this.classRepository.create({
        name: createClassDto.name,
        description: createClassDto.description,
        teacherId: currentUser.role === UserRole.TEACHER
          ? currentUser.userId
          : (createClassDto.teacherId ?? null),
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

  private async assertTeacher(teacherId: number) {
    const teacher = await this.userRepository.findOne({ where: { id: teacherId } });

    if (!teacher || teacher.role !== UserRole.TEACHER) {
      throw new UnprocessableEntityException('The selected class owner must be a professor.');
    }
  }

  private async assertStudents(studentIds: number[]) {
    if (!studentIds.length) return;

    const students = await this.userRepository.find(
      {
        where: {
          id: In(studentIds)
        }
      }
    );

    if (students.length !== new Set(studentIds).size || students.some((student) => student.role !== UserRole.STUDENT)) {
      throw new UnprocessableEntityException('Only student accounts can be enrolled in a class.');
    }
  }

  async update(id: number, updateClassDto: CreateOrReplaceClassDto) {
    updateClassDto.id = id;

    if (updateClassDto.id) {
      const existingClass = await this.classAccess.assertClassAccess(updateClassDto.id, true);

      if (!existingClass) {
        throw new ForbiddenException(`Class with id ${id} does not exist.`);
      }
    }

    const entity: BaseClassDto = { ...updateClassDto, id };

    if (updateClassDto.students) {
      await this.assertStudents(updateClassDto.students);
      await this.userClassService.deleteByClassId(id);
    }

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
    const user = this.requestContextService.getUser();
    const allRelations = ['userClasses', 'userClasses.user', 'userClasses.class']

    const queryByRole = {
      [UserRole.ADMIN]: {
        relations: allRelations,
        where: {},
      },

      [UserRole.TEACHER]: {
        relations: allRelations,
        where: {
          teacherId: user.userId,
        },
      },

      [UserRole.STUDENT]: {
        relations: [],
        where: {
          userClasses: {
            userId: user.userId,
          },
        },
      },
    };

    const classes = await this.classRepository.find(queryByRole[user.role]);

    return classes.map(ClassHelper.toResponseDto);
  }

  findOptions() {
    const user = this.requestContextService.getUser();

    const where = {
      [UserRole.ADMIN]: undefined,
      [UserRole.TEACHER]: { teacherId: user.userId },
      [UserRole.STUDENT]: { userClasses: { userId: user.userId } },
    }[user.role];

    return this.classRepository.find({
      select: {
        id: true,
        name: true
      },
      order: {
        name: 'ASC',
        id: 'ASC'
      },
      where
    });
  }

  async findAllPaginated(query: ListClassesQueryDto): Promise<PaginatedResult<ClassResponseDto>> {
    const { page, pageSize, skip } = buildPaginationParams(query);

    const user = this.requestContextService.getUser();

    const qb = this.classRepository
      .createQueryBuilder('class')
      .orderBy('class.id', 'DESC');

    const applyRoleQuery = {
      [UserRole.ADMIN]: () => {
        qb.leftJoinAndSelect('class.userClasses', 'userClasses')
          .leftJoinAndSelect('userClasses.user', 'user')
          .leftJoinAndSelect('userClasses.class', 'innerClass');
      },

      [UserRole.TEACHER]: () => {
        qb.leftJoinAndSelect('class.userClasses', 'userClasses')
          .leftJoinAndSelect('userClasses.user', 'user')
          .leftJoinAndSelect('userClasses.class', 'innerClass')
          .andWhere('class.teacherId = :userId', {
            userId: user.userId
          });
      },

      [UserRole.STUDENT]: () => {
        qb.leftJoin('class.userClasses', 'userClasses')
          .andWhere('userClasses.userId = :userId', {
            userId: user.userId
          });
      },
    };

    applyRoleQuery[user.role]();

    const wantsArchived = query.status === 'inactive' || query.includeArchived;

    if (wantsArchived && user.role !== UserRole.ADMIN) throw new ForbiddenException('Only admins can view archived classes.');

    if (query.status === 'inactive') {
      qb.withDeleted()
        .andWhere('class.deletedAt IS NOT NULL');
    } else if (query.includeArchived) {
      qb.withDeleted();
    } else {
      qb.andWhere('class.deletedAt IS NULL');
    }

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

    const canAccess = user.userId === userId || user.role === UserRole.ADMIN;

    if (!canAccess) {
      throw new ForbiddenException('You are not authorized to access classes of other users.');
    }

    const classes = user.role === UserRole.STUDENT
      ? await this.findAllByUserStudent(userId)
      : await this.classRepository.find({
          relations: [
            'userClasses',
            'userClasses.user',
            'userClasses.class',
            'assignments',
          ],
          ...(user.role === UserRole.TEACHER
            ? { where: { teacherId: user.userId } }
            : {}),
        });
    if (!classes.length) return [];
    const counts: { id: number; exams: number; practices: number; quizzes: number }[] =
      await this.classRepository.query(
        `SELECT c.id,
          (SELECT count(*)::int FROM exam e WHERE e."classId"=c.id
            AND ($4::boolean OR (e."startDate" IS NOT NULL AND e."startDate" <= $3))) AS exams,
          (SELECT count(*)::int FROM learning_activity a WHERE a."classId"=c.id AND a.kind='practice'
            AND ($2::boolean OR (a.published AND (a."startDate" IS NULL OR a."startDate" <= $3)))) AS practices,
          (SELECT count(*)::int FROM learning_activity a WHERE a."classId"=c.id AND a.kind='quiz'
            AND ($2::boolean OR (a.published AND (a."startDate" IS NULL OR a."startDate" <= $3)))) AS quizzes
         FROM "class" c WHERE c.id = ANY($1::int[])`,
        [
          classes.map((group) => group.id),
          user.role === UserRole.ADMIN,
          new Date(),
          user.role === UserRole.ADMIN || user.role === UserRole.TEACHER,
        ],
      );
    const byClass = new Map(counts.map(({ id, ...summary }) => [id, summary]));
    return classes.map((group) => ({
      ...group,
      activityCounts: byClass.get(group.id) ?? { exams: 0, practices: 0, quizzes: 0 },
    }));
  }

  async findOne(id: number) {
    const user = this.requestContextService.getUser();

    const relations   = user.role === UserRole.STUDENT ? [] : ['userClasses', 'userClasses.user', 'userClasses.class']
    const withDeleted = user.role === UserRole.ADMIN

    if (user.role === UserRole.ADMIN) {
      const existing = await this.classRepository.findOne({
        where: { id },
        withDeleted: true
      });

      if (!existing) throw new NotFoundException('Class not found');
    } else {
      await this.classAccess.assertClassAccess(id);
    }

    return this.classRepository.findOne({
      where: { id },
      withDeleted,
      relations
    });
  }

  async remove(id: number) {
    await this.classAccess.assertClassAccess(id, true);

    return this.classRepository.softDelete({ id });
  }

  async restore(id: number) {
    const existing = await this.classRepository.findOne({
      where: { id },
      withDeleted: true
    })

    if (!existing) throw new NotFoundException('Class not found');

    await this.classRepository.restore({ id });

    return this.findOne(id);
  }

  private findAllByUserStudent(userId: number) {
    const now = new Date();

      return this.classRepository
        .createQueryBuilder('class')
        .innerJoin(
          'class.userClasses',
          'userClass',
          'userClass.userId = :userId',
          { userId },
        )
        .leftJoinAndSelect(
          'class.assignments',
          'assignment',
          '(assignment.startDate IS NULL OR assignment.startDate <= :now)',
          { now },
        )
        .leftJoin('assignment.examAssignment', 'examAssignment')
        .leftJoin('examAssignment.exam', 'exam')
        .andWhere(
          `
            examAssignment.id IS NULL
            OR (
              exam.startDate IS NOT NULL
              AND exam.startDate <= :now
            )
          `,
          { now },
        )
        .getMany();
  }
}
