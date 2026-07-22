import { ConflictException, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, QueryFailedError, Brackets } from 'typeorm';
import { AssignmentService } from 'src/assignment/assignment.service';
import { Assignment } from 'src/assignment/entities/assignment.entity';
import { ClassService } from 'src/class/class.service';
import { RequestContextService } from 'src/request-context/request-context.service';
import { UserClassService } from 'src/user-class/user-class.service';
import { WorkerType } from 'src/worker/enum/worker-type.enum';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { ExamActivity } from './entities/exam-activity.entity';
import { Exam } from './entities/exam.entity';
import { ExamService } from './exam.service';

describe('ExamService', () => {
  let service: ExamService;

  const createRepositoryMock = () => ({
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneOrFail: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  });

  const setup = async () => {
    const examRepository = createRepositoryMock();
    const examActivityRepository = createRepositoryMock();
    const assignmentRepository = createRepositoryMock();
    const classService = { findOne: jest.fn() };
    const userClassService = { findOneByKeys: jest.fn() };
    const requestContextService = { getUser: jest.fn() };
    const dataSource = { transaction: jest.fn() };
    const assignmentService = { create: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExamService,
        {
          provide: getRepositoryToken(Exam),
          useValue: examRepository,
        },
        {
          provide: getRepositoryToken(ExamActivity),
          useValue: examActivityRepository,
        },
        {
          provide: getRepositoryToken(Assignment),
          useValue: assignmentRepository,
        },
        {
          provide: ClassService,
          useValue: classService,
        },
        {
          provide: UserClassService,
          useValue: userClassService,
        },
        {
          provide: RequestContextService,
          useValue: requestContextService,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
        {
          provide: AssignmentService,
          useValue: assignmentService,
        },
      ],
    }).compile();

    return {
      service: module.get<ExamService>(ExamService),
      examRepository,
      examActivityRepository,
      assignmentRepository,
      classService,
      userClassService,
      requestContextService,
      dataSource,
      assignmentService,
    };
  };

  const makeQueryBuilder = () => {
    const qb: Record<string, jest.Mock> = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    };
    return qb;
  };

  beforeEach(async () => {
    ({ service } = await setup());
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('persists the exam with all fields populated', async () => {
      const { service, examRepository, classService } = await setup();

      classService.findOne.mockResolvedValue({ id: 5 });
      const dueDate = new Date('2026-08-15T23:59:00Z');
      const saved = {
        id: 1,
        title: 'Midterm',
        description: 'Covers chapters 1-5',
        classId: 5,
        dueDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      examRepository.save.mockResolvedValue(saved);

      const dto: CreateExamDto = {
        title: 'Midterm',
        description: 'Covers chapters 1-5',
        classId: 5,
        dueDate: '2026-08-15T23:59:00Z',
      };

      const result = await service.create(dto);

      expect(classService.findOne).toHaveBeenCalledWith(5);
      expect(examRepository.save).toHaveBeenCalledWith({
        title: 'Midterm',
        description: 'Covers chapters 1-5',
        classId: 5,
        dueDate,
      });
      expect(result).toEqual(saved);
    });

    it('persists the exam with only the title when other fields are omitted', async () => {
      const { service, examRepository, classService } = await setup();

      const saved = {
        id: 2,
        title: 'Quick quiz',
        description: undefined,
        classId: undefined,
        dueDate: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      examRepository.save.mockResolvedValue(saved);

      const result = await service.create({ title: 'Quick quiz' });

      expect(classService.findOne).not.toHaveBeenCalled();
      expect(examRepository.save).toHaveBeenCalledWith({
        title: 'Quick quiz',
        description: undefined,
        classId: undefined,
        dueDate: undefined,
      });
      expect(result).toEqual(saved);
    });

    it('throws NotFoundException when classId references a non-existent class', async () => {
      const { service, examRepository, classService } = await setup();

      classService.findOne.mockResolvedValue(null);

      await expect(
        service.create({
          title: 'Midterm',
          classId: 999,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(classService.findOne).toHaveBeenCalledWith(999);
      expect(examRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findByClass', () => {
    it('returns paginated exams for an enrolled student', async () => {
      const {
        service,
        classService,
        userClassService,
        examRepository,
        requestContextService,
      } = await setup();

      classService.findOne.mockResolvedValue({ id: 1 });
      userClassService.findOneByKeys.mockResolvedValue({ userId: 7, classId: 1 });
      requestContextService.getUser.mockReturnValue({
        userId: 7,
        isAdmin: false,
      });
      const qb = makeQueryBuilder();
      qb.getManyAndCount.mockResolvedValue([[{ id: 10 }, { id: 11 }], 2]);
      examRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findByClass(1, { page: 1, pageSize: 10 });

      expect(classService.findOne).toHaveBeenCalledWith(1);
      expect(userClassService.findOneByKeys).toHaveBeenCalledWith(7, 1);
      expect(qb.where).toHaveBeenCalledWith('exam.classId = :classId', {
        classId: 1,
      });
      expect(qb.orderBy).toHaveBeenCalledWith('exam.dueDate', 'ASC');
      expect(qb.skip).toHaveBeenCalledWith(0);
      expect(qb.take).toHaveBeenCalledWith(10);
      expect(result).toEqual({
        data: [{ id: 10 }, { id: 11 }],
        meta: { total: 2, page: 1, pageSize: 10, totalPages: 1 },
      });
    });

    it('throws ForbiddenException when the student is not enrolled in the class', async () => {
      const {
        service,
        classService,
        userClassService,
        examRepository,
        requestContextService,
      } = await setup();

      classService.findOne.mockResolvedValue({ id: 1 });
      userClassService.findOneByKeys.mockResolvedValue(null);
      requestContextService.getUser.mockReturnValue({
        userId: 7,
        isAdmin: false,
      });

      await expect(
        service.findByClass(1, { page: 1, pageSize: 10 }),
      ).rejects.toBeInstanceOf(ForbiddenException);

      expect(userClassService.findOneByKeys).toHaveBeenCalledWith(7, 1);
      expect(examRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the class does not exist', async () => {
      const {
        service,
        classService,
        userClassService,
        examRepository,
        requestContextService,
      } = await setup();

      classService.findOne.mockResolvedValue(null);

      await expect(
        service.findByClass(999, { page: 1, pageSize: 10 }),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(classService.findOne).toHaveBeenCalledWith(999);
      expect(userClassService.findOneByKeys).not.toHaveBeenCalled();
      expect(requestContextService.getUser).not.toHaveBeenCalled();
      expect(examRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('applies the requested sort direction, skip and take from the query', async () => {
      const {
        service,
        classService,
        userClassService,
        examRepository,
        requestContextService,
      } = await setup();

      classService.findOne.mockResolvedValue({ id: 1 });
      userClassService.findOneByKeys.mockResolvedValue({ userId: 7, classId: 1 });
      requestContextService.getUser.mockReturnValue({
        userId: 7,
        isAdmin: false,
      });
      const qb = makeQueryBuilder();
      qb.getManyAndCount.mockResolvedValue([[], 0]);
      examRepository.createQueryBuilder.mockReturnValue(qb);

      // Default: asc, page 1, pageSize 10
      await service.findByClass(1, { page: 1, pageSize: 10 });
      expect(qb.orderBy).toHaveBeenLastCalledWith('exam.dueDate', 'ASC');
      expect(qb.skip).toHaveBeenLastCalledWith(0);
      expect(qb.take).toHaveBeenLastCalledWith(10);

      // Explicit desc + pagination
      await service.findByClass(1, { page: 2, pageSize: 5, sort: 'desc' });
      expect(qb.orderBy).toHaveBeenLastCalledWith('exam.dueDate', 'DESC');
      expect(qb.skip).toHaveBeenLastCalledWith(5);
      expect(qb.take).toHaveBeenLastCalledWith(5);
    });

    it('applies a case-insensitive substring filter on title and description when search is provided', async () => {
      const {
        service,
        classService,
        userClassService,
        examRepository,
        requestContextService,
      } = await setup();

      classService.findOne.mockResolvedValue({ id: 1 });
      userClassService.findOneByKeys.mockResolvedValue({ userId: 7, classId: 1 });
      requestContextService.getUser.mockReturnValue({
        userId: 7,
        isAdmin: false,
      });
      const qb = makeQueryBuilder();
      qb.getManyAndCount.mockResolvedValue([[{ id: 10 }], 1]);
      examRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findByClass(1, {
        page: 1,
        pageSize: 10,
        search: 'midterm',
      });

      expect(qb.andWhere).toHaveBeenCalledWith(expect.any(Brackets));
      expect(result).toEqual({
        data: [{ id: 10 }],
        meta: { total: 1, page: 1, pageSize: 10, totalPages: 1 },
      });
    });
  });

  describe('update', () => {
    it('updates only the fields that were provided', async () => {
      const { service, examRepository } = await setup();

      examRepository.findOne.mockResolvedValue({ id: 1 });
      examRepository.findOneOrFail.mockResolvedValue({
        id: 1,
        title: 'New title',
      });

      await service.update(1, { title: 'New title' });

      expect(examRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(examRepository.update).toHaveBeenCalledTimes(1);
      expect(examRepository.update).toHaveBeenCalledWith(1, {
        title: 'New title',
      });
      expect(examRepository.findOneOrFail).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('updates title, description and dueDate together and returns the updated exam', async () => {
      const { service, examRepository } = await setup();

      const dueDate = new Date('2026-09-01T12:00:00Z');
      examRepository.findOne.mockResolvedValue({ id: 1 });
      examRepository.findOneOrFail.mockResolvedValue({
        id: 1,
        title: 'Final',
        description: 'Updated description',
        dueDate,
      });

      const result = await service.update(1, {
        title: 'Final',
        description: 'Updated description',
        dueDate: '2026-09-01T12:00:00Z',
      });

      expect(examRepository.update).toHaveBeenCalledWith(1, {
        title: 'Final',
        description: 'Updated description',
        dueDate,
      });
      expect(examRepository.findOneOrFail).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual({
        id: 1,
        title: 'Final',
        description: 'Updated description',
        dueDate,
      });
    });

    it('throws NotFoundException when the exam does not exist', async () => {
      const { service, examRepository } = await setup();

      examRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(999, { title: 'Anything' }),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(examRepository.update).not.toHaveBeenCalled();
      expect(examRepository.findOneOrFail).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deletes the exam and its activity links in a single transaction', async () => {
      const { service, examRepository, dataSource } = await setup();

      examRepository.findOne.mockResolvedValue({ id: 1 });
      const manager = {
        delete: jest
          .fn()
          .mockResolvedValueOnce({ raw: [], affected: 3 })
          .mockResolvedValueOnce({ raw: [], affected: 1 }),
      };
      dataSource.transaction.mockImplementation(async (cb) => cb(manager));

      const result = await service.remove(1);

      expect(examRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(manager.delete).toHaveBeenCalledTimes(2);
      expect(manager.delete).toHaveBeenNthCalledWith(
        1,
        ExamActivity,
        { examId: 1 },
      );
      expect(manager.delete).toHaveBeenNthCalledWith(2, Exam, { id: 1 });
      expect(result).toEqual({ raw: [], affected: 1 });
    });

    it('throws NotFoundException when the exam does not exist', async () => {
      const { service, examRepository, dataSource } = await setup();

      examRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );

      expect(dataSource.transaction).not.toHaveBeenCalled();
    });
  });

  describe('createActivityAndLink', () => {
    it('creates the activity via AssignmentService and links it to the exam in a single transaction', async () => {
      const {
        service,
        examRepository,
        dataSource,
        assignmentService,
      } = await setup();

      const exam = { id: 1, classId: 5 };
      examRepository.findOne.mockResolvedValue(exam);

      const newActivity = {
        id: 42,
        title: 'Activity 1',
        description: 'desc',
        classId: 5,
        maxAttempts: 3,
        workerType: 'node_default',
        boilerplate: 'console.log("hi")',
        boilerplateContent: 'console.log("hi")',
        validationScript: 'console.log("hi")',
      };
      assignmentService.create.mockResolvedValue(newActivity);

      const manager = {
        save: jest.fn().mockResolvedValue({ id: 99 }),
      };
      dataSource.transaction.mockImplementation(async (cb) => cb(manager));

      const dto = {
        classId: 5,
        title: 'Activity 1',
        description: 'desc',
        maxAttempts: 3,
        workerType: 'node_default' as any,
        validationScript: 'console.log("hi")',
        templates: [],
      };

      const result = await service.createActivityAndLink(1, dto);

      expect(examRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(assignmentService.create).toHaveBeenCalledWith(dto, manager);
      expect(manager.save).toHaveBeenCalledWith(ExamActivity, {
        examId: 1,
        activityId: 42,
      });
      expect(result).toEqual({ ...newActivity, exam });
    });

    it('throws ConflictException and aborts the transaction when the activity is already linked to another exam (unique violation 23505)', async () => {
      const {
        service,
        examRepository,
        dataSource,
        assignmentService,
      } = await setup();

      examRepository.findOne.mockResolvedValue({ id: 1, classId: 5 });
      assignmentService.create.mockResolvedValue({
        id: 42,
        classId: 5,
      });

      const driverError: any = new Error(
        'duplicate key value violates unique constraint',
      );
      driverError.code = '23505';
      const dbError: any = new QueryFailedError(
        'INSERT INTO "exam_activity" ...',
        [],
        driverError,
      );
      dbError.code = '23505';

      const manager = {
        save: jest.fn().mockRejectedValue(dbError),
      };
      dataSource.transaction.mockImplementation(async (cb) => cb(manager));

      const dto = {
        classId: 5,
        title: 'Activity 1',
        description: 'desc',
        maxAttempts: 3,
        workerType: 'node_default' as any,
        validationScript: 'console.log("hi")',
        templates: [],
      };

      await expect(
        service.createActivityAndLink(1, dto),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(assignmentService.create).toHaveBeenCalledTimes(1);
      expect(manager.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('linkActivity', () => {
    it('throws NotFoundException when the exam does not exist', async () => {
      const {
        service,
        examRepository,
        examActivityRepository,
        assignmentRepository,
      } = await setup();

      examRepository.findOne.mockResolvedValue(null);

      await expect(service.linkActivity(1, 2)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(examRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(assignmentRepository.findOne).not.toHaveBeenCalled();
      expect(examActivityRepository.save).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the activity does not exist', async () => {
      const {
        service,
        examRepository,
        examActivityRepository,
        assignmentRepository,
      } = await setup();

      examRepository.findOne.mockResolvedValue({ id: 1 });
      assignmentRepository.findOne.mockResolvedValue(null);

      await expect(service.linkActivity(1, 2)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(examRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(assignmentRepository.findOne).toHaveBeenCalledWith({
        where: { id: 2 },
      });
      expect(examActivityRepository.save).not.toHaveBeenCalled();
    });

    it('throws ConflictException when the activity is already linked (unique violation 23505)', async () => {
      const {
        service,
        examRepository,
        examActivityRepository,
        assignmentRepository,
      } = await setup();

      examRepository.findOne.mockResolvedValue({ id: 1 });
      assignmentRepository.findOne.mockResolvedValue({ id: 2 });

      const driverError: any = new Error(
        'duplicate key value violates unique constraint',
      );
      driverError.code = '23505';
      const dbError: any = new QueryFailedError(
        'INSERT INTO "exam_activity" ...',
        [],
        driverError,
      );
      dbError.code = '23505';
      examActivityRepository.save.mockRejectedValue(dbError);

      await expect(service.linkActivity(1, 2)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(examActivityRepository.save).toHaveBeenCalledWith({
        examId: 1,
        activityId: 2,
      });
      expect(examActivityRepository.findOneOrFail).not.toHaveBeenCalled();
    });

    it('creates the link and returns it with relations when all checks pass', async () => {
      const {
        service,
        examRepository,
        examActivityRepository,
        assignmentRepository,
      } = await setup();

      examRepository.findOne.mockResolvedValue({ id: 1 });
      assignmentRepository.findOne.mockResolvedValue({ id: 2 });
      examActivityRepository.save.mockResolvedValue({
        id: 99,
        examId: 1,
        activityId: 2,
      });
      const hydrated = {
        id: 99,
        examId: 1,
        activityId: 2,
        exam: { id: 1, title: 'Midterm' },
        activity: { id: 2, title: 'Activity 2' },
      };
      examActivityRepository.findOneOrFail.mockResolvedValue(hydrated);

      const result = await service.linkActivity(1, 2);

      expect(examActivityRepository.save).toHaveBeenCalledWith({
        examId: 1,
        activityId: 2,
      });
      expect(examActivityRepository.findOneOrFail).toHaveBeenCalledWith({
        where: { id: 99 },
        relations: ['exam', 'activity'],
      });
      expect(result).toEqual(hydrated);
    });
  });

  describe('unlinkActivity', () => {
    it('throws NotFoundException when the exam does not exist', async () => {
      const {
        service,
        examRepository,
        examActivityRepository,
        assignmentRepository,
      } = await setup();

      examRepository.findOne.mockResolvedValue(null);

      await expect(service.unlinkActivity(1, 2)).rejects.toBeInstanceOf(
        NotFoundException,
      );

      expect(examRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(assignmentRepository.findOne).not.toHaveBeenCalled();
      expect(examActivityRepository.findOne).not.toHaveBeenCalled();
      expect(examActivityRepository.delete).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the activity does not exist', async () => {
      const {
        service,
        examRepository,
        examActivityRepository,
        assignmentRepository,
      } = await setup();

      examRepository.findOne.mockResolvedValue({ id: 1 });
      assignmentRepository.findOne.mockResolvedValue(null);

      await expect(service.unlinkActivity(1, 2)).rejects.toBeInstanceOf(
        NotFoundException,
      );

      expect(examRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(assignmentRepository.findOne).toHaveBeenCalledWith({
        where: { id: 2 },
      });
      expect(examActivityRepository.findOne).not.toHaveBeenCalled();
      expect(examActivityRepository.delete).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the link between exam and activity does not exist', async () => {
      const {
        service,
        examRepository,
        examActivityRepository,
        assignmentRepository,
      } = await setup();

      examRepository.findOne.mockResolvedValue({ id: 1 });
      assignmentRepository.findOne.mockResolvedValue({ id: 2 });
      examActivityRepository.findOne.mockResolvedValue(null);

      await expect(service.unlinkActivity(1, 2)).rejects.toBeInstanceOf(
        NotFoundException,
      );

      expect(examActivityRepository.findOne).toHaveBeenCalledWith({
        where: { examId: 1, activityId: 2 },
      });
      expect(examActivityRepository.delete).not.toHaveBeenCalled();
    });

    it('deletes the link and returns void when exam, activity and link all exist', async () => {
      const {
        service,
        examRepository,
        examActivityRepository,
        assignmentRepository,
      } = await setup();

      examRepository.findOne.mockResolvedValue({ id: 1 });
      assignmentRepository.findOne.mockResolvedValue({ id: 2 });
      examActivityRepository.findOne.mockResolvedValue({
        id: 99,
        examId: 1,
        activityId: 2,
      });
      examActivityRepository.delete.mockResolvedValue({ raw: [], affected: 1 });

      const result = await service.unlinkActivity(1, 2);

      expect(examActivityRepository.findOne).toHaveBeenCalledWith({
        where: { examId: 1, activityId: 2 },
      });
      expect(examActivityRepository.delete).toHaveBeenCalledWith({ id: 99 });
      expect(result).toBeUndefined();
    });
  });

  describe('findOneWithActivities', () => {
    it('throws NotFoundException when the exam does not exist', async () => {
      const {
        service,
        examRepository,
        examActivityRepository,
        requestContextService,
        userClassService,
      } = await setup();

      examRepository.findOne.mockResolvedValue(null);
      requestContextService.getUser.mockReturnValue({
        userId: 7,
        isAdmin: false,
      });

      await expect(service.findOneWithActivities(123)).rejects.toBeInstanceOf(
        NotFoundException,
      );

      expect(examRepository.findOne).toHaveBeenCalledWith({
        where: { id: 123 },
      });
      expect(requestContextService.getUser).not.toHaveBeenCalled();
      expect(userClassService.findOneByKeys).not.toHaveBeenCalled();
      expect(examActivityRepository.find).not.toHaveBeenCalled();
    });

    it('returns the exam with an empty activities array when there are no linked activities', async () => {
      const {
        service,
        examRepository,
        examActivityRepository,
        requestContextService,
        userClassService,
      } = await setup();

      const exam = {
        id: 1,
        title: 'Midterm',
        description: 'Covers chapters 1-5',
        classId: 5,
        dueDate: new Date('2026-08-15T23:59:00Z'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      examRepository.findOne.mockResolvedValue(exam);
      requestContextService.getUser.mockReturnValue({
        userId: 7,
        isAdmin: false,
      });
      userClassService.findOneByKeys.mockResolvedValue({
        userId: 7,
        classId: 5,
      });
      examActivityRepository.find.mockResolvedValue([]);

      const result = await service.findOneWithActivities(1);

      expect(userClassService.findOneByKeys).toHaveBeenCalledWith(7, 5);
      expect(examActivityRepository.find).toHaveBeenCalledWith({
        where: { examId: 1 },
        relations: ['activity'],
        order: { id: 'ASC' },
      });
      expect(result).toEqual({ exam, activities: [] });
    });

    it('returns the exam with activities mapped to the summary DTO and ordered by ExamActivity id', async () => {
      const {
        service,
        examRepository,
        examActivityRepository,
        requestContextService,
        userClassService,
      } = await setup();

      const exam = { id: 1, title: 'Midterm', classId: 5 };
      examRepository.findOne.mockResolvedValue(exam);
      requestContextService.getUser.mockReturnValue({
        userId: 7,
        isAdmin: false,
      });
      userClassService.findOneByKeys.mockResolvedValue({
        userId: 7,
        classId: 5,
      });

      const activityB = {
        id: 20,
        title: 'Activity B',
        description: 'B desc',
        classId: 5,
        maxAttempts: 2,
        workerType: WorkerType.NODE_NESTJS,
        initSqlScript: 'secret',
        boilerplateFilePath: '/secret',
        interviewConfig: { questions: [] },
      };
      const activityA = {
        id: 10,
        title: 'Activity A',
        description: 'A desc',
        classId: 5,
        maxAttempts: 3,
        workerType: WorkerType.NODE_DEFAULT,
      };
      examActivityRepository.find.mockResolvedValue([
        { id: 2, examId: 1, activityId: 20, activity: activityB },
        { id: 1, examId: 1, activityId: 10, activity: activityA },
      ]);

      const result = await service.findOneWithActivities(1);

      expect(result.exam).toEqual(exam);
      expect(result.activities).toEqual([
        {
          id: 20,
          title: 'Activity B',
          description: 'B desc',
          classId: 5,
          maxAttempts: 2,
          workerType: WorkerType.NODE_NESTJS,
        },
        {
          id: 10,
          title: 'Activity A',
          description: 'A desc',
          classId: 5,
          maxAttempts: 3,
          workerType: WorkerType.NODE_DEFAULT,
        },
      ]);
      expect(result.activities[0]).not.toHaveProperty('initSqlScript');
      expect(result.activities[0]).not.toHaveProperty('boilerplateFilePath');
      expect(result.activities[0]).not.toHaveProperty('interviewConfig');
    });

    it('skips the enrollment check when the user is an admin', async () => {
      const {
        service,
        examRepository,
        examActivityRepository,
        requestContextService,
        userClassService,
      } = await setup();

      examRepository.findOne.mockResolvedValue({ id: 1, classId: 5 });
      requestContextService.getUser.mockReturnValue({
        userId: 7,
        isAdmin: true,
      });
      examActivityRepository.find.mockResolvedValue([]);

      const result = await service.findOneWithActivities(1);

      expect(userClassService.findOneByKeys).not.toHaveBeenCalled();
      expect(result).toEqual({ exam: { id: 1, classId: 5 }, activities: [] });
    });

    it('throws ForbiddenException when a non-admin user is not enrolled in the exam class', async () => {
      const {
        service,
        examRepository,
        examActivityRepository,
        requestContextService,
        userClassService,
      } = await setup();

      examRepository.findOne.mockResolvedValue({ id: 1, classId: 5 });
      requestContextService.getUser.mockReturnValue({
        userId: 7,
        isAdmin: false,
      });
      userClassService.findOneByKeys.mockResolvedValue(null);

      await expect(service.findOneWithActivities(1)).rejects.toBeInstanceOf(
        ForbiddenException,
      );

      expect(userClassService.findOneByKeys).toHaveBeenCalledWith(7, 5);
      expect(examActivityRepository.find).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when a non-admin user tries to view an exam without a class', async () => {
      const {
        service,
        examRepository,
        examActivityRepository,
        requestContextService,
        userClassService,
      } = await setup();

      examRepository.findOne.mockResolvedValue({
        id: 1,
        classId: null,
      });
      requestContextService.getUser.mockReturnValue({
        userId: 7,
        isAdmin: false,
      });

      await expect(service.findOneWithActivities(1)).rejects.toBeInstanceOf(
        ForbiddenException,
      );

      expect(userClassService.findOneByKeys).not.toHaveBeenCalled();
      expect(examActivityRepository.find).not.toHaveBeenCalled();
    });
  });
});
