import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, QueryFailedError, Brackets } from 'typeorm';
import { AssignmentService } from 'src/assignment/assignment.service';
import { Assignment } from 'src/assignment/entities/assignment.entity';
import { ClassService } from 'src/class/class.service';
import { RequestContextService } from 'src/request-context/request-context.service';
import { UserClassService } from 'src/user-class/user-class.service';
import { UserClass } from 'src/user-class/entities/user-class.entity';
import { Attempt } from 'src/attempt/entities/attempt.entity';
import { AttemptStatus } from 'src/attempt/enums/attempt-status.enum';
import { WorkerType } from 'src/worker/enum/worker-type.enum';
import { CreateExamDto } from './dto/create-exam.dto';
import { ExamAssignment } from './entities/exam-assignment.entity';
import { Exam } from './entities/exam.entity';
import { ExamService } from './exam.service';
import { User } from 'src/user/entities/user.entity';
import { AssignmentAlertService } from 'src/assignment-alert/assignment-alert.service';

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
    const examAssignmentRepository = createRepositoryMock();
    const assignmentRepository = createRepositoryMock();
    const userRepository = createRepositoryMock();
    const attemptRepository = createRepositoryMock();
    const userClassRepository = createRepositoryMock();
    const classService = { findOne: jest.fn() };
    const userClassService = { findOneByKeys: jest.fn() };
    const requestContextService = { getUser: jest.fn() };
    const dataSource = { transaction: jest.fn() };
    const assignmentService = { create: jest.fn() };
    const assignmentAlertService = {
      decorateAssignments: jest.fn(async (assignments: Assignment[]) => {
        assignments.forEach((assignment) => {
          assignment.currentUserAlertStatus ??= {
            activeCount: 0,
            limit: assignment.suspensionAlertLimit ?? 5,
            suspended: false
          };
        });
        return assignments;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExamService,
        {
          provide: getRepositoryToken(Exam),
          useValue: examRepository,
        },
        {
          provide: getRepositoryToken(ExamAssignment),
          useValue: examAssignmentRepository,
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
        {
          provide: AssignmentAlertService,
          useValue: assignmentAlertService
        },
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        {
          provide: getRepositoryToken(Attempt),
          useValue: attemptRepository,
        },
        {
          provide: getRepositoryToken(UserClass),
          useValue: userClassRepository,
        },
      ],
    }).compile();

    const userStudent = requestContextService.getUser.mockReturnValue({
      userId: 7,
      isAdmin: false
    });

    return {
      service: module.get<ExamService>(ExamService),
      examRepository,
      examAssignmentRepository,
      assignmentRepository,
      attemptRepository,
      userClassRepository,
      classService,
      userClassService,
      requestContextService,
      dataSource,
      assignmentService,
      assignmentAlertService,
      userStudent
    };
  };

  const makeQueryBuilder = () => {
    const qb: Record<string, jest.Mock> = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
      getMany: jest.fn(),
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

    it('persists the exam with startDate when provided', async () => {
      const { service, examRepository, classService } = await setup();

      const startDate = new Date('2026-08-15T12:00:00Z');
      const saved = {
        id: 1,
        title: 'Midterm',
        startDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      examRepository.save.mockResolvedValue(saved);

      const result = await service.create({
        title: 'Midterm',
        startDate: '2026-08-15T12:00:00Z',
      });

      expect(examRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ startDate }),
      );
      expect(result).toEqual(saved);
    });

    it('rejects startDate strictly after dueDate', async () => {
      const { service, classService } = await setup();

      classService.findOne.mockResolvedValue({ id: 5 });

      const dto = {
        title: 'Bad exam',
        classId: 5,
        startDate: '2026-08-16T00:00:00Z',
        dueDate: '2026-08-15T23:59:00Z',
      };

      await expect(service.create(dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('allows startDate equal to dueDate', async () => {
      const { service, examRepository, classService } = await setup();

      classService.findOne.mockResolvedValue({ id: 5 });
      const date = new Date('2026-08-15T23:59:00Z');
      examRepository.save.mockResolvedValue({ id: 1 });

      await service.create({
        title: 'Equal dates',
        classId: 5,
        startDate: '2026-08-15T23:59:00Z',
        dueDate: '2026-08-15T23:59:00Z',
      });

      expect(examRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ startDate: date, dueDate: date }),
      );
    });

    it('allows startDate without dueDate', async () => {
      const { service, examRepository, classService } = await setup();

      classService.findOne.mockResolvedValue({ id: 5 });
      const startDate = new Date('2026-08-15T12:00:00Z');
      examRepository.save.mockResolvedValue({ id: 1 });

      await service.create({
        title: 'Start only',
        classId: 5,
        startDate: '2026-08-15T12:00:00Z',
      });

      expect(examRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ startDate, dueDate: undefined }),
      );
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
      userClassService.findOneByKeys.mockResolvedValue({
        userId: 7,
        classId: 1
      });
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
      userClassService.findOneByKeys.mockResolvedValue({
        userId: 7,
        classId: 1,
      });
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
      userClassService.findOneByKeys.mockResolvedValue({
        userId: 7,
        classId: 1,
      });
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

    it('adds startDate filter for non-admin users', async () => {
      const {
        service,
        classService,
        userClassService,
        examRepository,
        requestContextService,
      } = await setup();

      classService.findOne.mockResolvedValue({ id: 1 });
      userClassService.findOneByKeys.mockResolvedValue({
        userId: 7,
        classId: 1,
      });
      requestContextService.getUser.mockReturnValue({
        userId: 7,
        isAdmin: false,
      });
      const qb = makeQueryBuilder();
      qb.getManyAndCount.mockResolvedValue([[], 0]);
      examRepository.createQueryBuilder.mockReturnValue(qb);

      await service.findByClass(1, { page: 1, pageSize: 10 });

      expect(qb.andWhere).toHaveBeenCalledWith(
        'exam.startDate IS NOT NULL AND exam.startDate <= :now',
        { now: expect.any(Date) },
      );
    });

    it('does not add startDate filter for admin users', async () => {
      const {
        service,
        classService,
        userClassService,
        examRepository,
        requestContextService,
      } = await setup();

      classService.findOne.mockResolvedValue({ id: 1 });
      requestContextService.getUser.mockReturnValue({
        userId: 1,
        isAdmin: true,
      });

      const qb = makeQueryBuilder();
      qb.getManyAndCount.mockResolvedValue([[], 0]);
      examRepository.createQueryBuilder.mockReturnValue(qb);

      await service.findByClass(1, { page: 1, pageSize: 10 });

      const calls = qb.andWhere.mock.calls.filter(
        ([arg]) =>
          typeof arg === 'string' &&
          arg.includes('exam.startDate'),
      );
      expect(calls).toHaveLength(0);
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

    it('updates startDate alone', async () => {
      const { service, examRepository } = await setup();

      const startDate = new Date('2026-08-15T12:00:00Z');
      examRepository.findOne.mockResolvedValue({
        id: 1,
        title: 'Exam',
        startDate: null,
        dueDate: null,
      });
      examRepository.findOneOrFail.mockResolvedValue({
        id: 1,
        title: 'Exam',
        startDate,
      });

      const result = await service.update(1, {
        startDate: '2026-08-15T12:00:00Z',
      });

      expect(examRepository.update).toHaveBeenCalledWith(1, { startDate });
      expect(result).toEqual({ id: 1, title: 'Exam', startDate });
    });

    it('clears startDate when null is provided', async () => {
      const { service, examRepository } = await setup();

      examRepository.findOne.mockResolvedValue({
        id: 1,
        title: 'Exam',
        startDate: new Date('2026-08-15T12:00:00Z'),
        dueDate: null,
      });
      examRepository.findOneOrFail.mockResolvedValue({
        id: 1,
        title: 'Exam',
        startDate: null,
      });

      const result = await service.update(1, { startDate: null });

      expect(examRepository.update).toHaveBeenCalledWith(1, {
        startDate: null,
      });
      expect(result).toEqual({ id: 1, title: 'Exam', startDate: null });
    });

    it('does not change startDate when omitted from the payload', async () => {
      const { service, examRepository } = await setup();

      const existingStartDate = new Date('2026-08-15T12:00:00Z');
      examRepository.findOne.mockResolvedValue({
        id: 1,
        title: 'Exam',
        startDate: existingStartDate,
        dueDate: null,
      });
      examRepository.findOneOrFail.mockResolvedValue({
        id: 1,
        title: 'Exam',
        startDate: existingStartDate,
      });

      const result = await service.update(1, { title: 'Only title' });

      expect(examRepository.update).toHaveBeenCalledWith(1, {
        title: 'Only title',
      });
      expect(result).toEqual({
        id: 1,
        title: 'Exam',
        startDate: existingStartDate,
      });
    });

    it('rejects startDate after dueDate with post-merge values (both new)', async () => {
      const { service, examRepository } = await setup();

      examRepository.findOne.mockResolvedValue({
        id: 1,
        title: 'Exam',
        startDate: null,
        dueDate: null,
      });

      await expect(
        service.update(1, {
          startDate: '2026-08-16T00:00:00Z',
          dueDate: '2026-08-15T23:59:00Z',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(examRepository.update).not.toHaveBeenCalled();
    });

    it('rejects startDate after dueDate with post-merge values (new startDate vs existing dueDate)', async () => {
      const { service, examRepository } = await setup();

      examRepository.findOne.mockResolvedValue({
        id: 1,
        title: 'Exam',
        startDate: null,
        dueDate: new Date('2026-08-15T23:59:00Z'),
      });

      await expect(
        service.update(1, { startDate: '2026-08-16T00:00:00Z' }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(examRepository.update).not.toHaveBeenCalled();
    });

    it('rejects startDate after dueDate with post-merge values (new dueDate vs existing startDate)', async () => {
      const { service, examRepository } = await setup();

      examRepository.findOne.mockResolvedValue({
        id: 1,
        title: 'Exam',
        startDate: new Date('2026-08-16T00:00:00Z'),
        dueDate: null,
      });

      await expect(
        service.update(1, { dueDate: '2026-08-15T23:59:00Z' }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(examRepository.update).not.toHaveBeenCalled();
    });

    it('updates title, description, dueDate and startDate together', async () => {
      const { service, examRepository } = await setup();

      const dueDate = new Date('2026-09-01T12:00:00Z');
      const startDate = new Date('2026-08-01T12:00:00Z');
      examRepository.findOne.mockResolvedValue({
        id: 1,
        dueDate: null,
        startDate: null,
      });
      examRepository.findOneOrFail.mockResolvedValue({
        id: 1,
        title: 'Final',
        description: 'Updated',
        dueDate,
        startDate,
      });

      await service.update(1, {
        title: 'Final',
        description: 'Updated',
        dueDate: '2026-09-01T12:00:00Z',
        startDate: '2026-08-01T12:00:00Z',
      });

      expect(examRepository.update).toHaveBeenCalledWith(1, {
        title: 'Final',
        description: 'Updated',
        dueDate,
        startDate,
      });
    });
  });

  describe('remove', () => {
    it('deletes the exam and its assignment links in a single transaction', async () => {
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
        ExamAssignment,
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

  describe('createAssignmentAndLink', () => {
    it('creates the assignment via AssignmentService and links it to the exam in a single transaction', async () => {
      const {
        service,
        examRepository,
        dataSource,
        assignmentService,
      } = await setup();

      const exam = { id: 1, classId: 5, startDate: new Date('2025-01-01T00:00:00Z') };
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
        score: 5,
      };

      const result = await service.createAssignmentAndLink(1, dto);

      expect(examRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(assignmentService.create).toHaveBeenCalledWith(dto, manager);
      expect(manager.save).toHaveBeenCalledWith(ExamAssignment, {
        examId: 1,
        assignmentId: 42,
        score: 5,
      });
      expect(result).toEqual({ ...newActivity, exam, score: 5 });
    });

    it('throws BadRequestException when score is 0', async () => {
      const { service, examRepository, assignmentService } = await setup();

      examRepository.findOne.mockResolvedValue({ id: 1, classId: 5 });

      await expect(
        service.createAssignmentAndLink(1, {
          classId: 5,
          title: 'A',
          description: 'd',
          maxAttempts: 1,
          workerType: 'node_default' as any,
          validationScript: undefined as any,
          templates: [],
          score: 0,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(assignmentService.create).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when score is negative', async () => {
      const { service, examRepository, assignmentService } = await setup();

      examRepository.findOne.mockResolvedValue({ id: 1, classId: 5 });

      await expect(
        service.createAssignmentAndLink(1, {
          classId: 5,
          title: 'A',
          description: 'd',
          maxAttempts: 1,
          workerType: 'node_default' as any,
          validationScript: undefined as any,
          templates: [],
          score: -2,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(assignmentService.create).not.toHaveBeenCalled();
    });

    it('throws ConflictException and aborts the transaction when the assignment is already linked to another exam (unique violation 23505)', async () => {
      const {
        service,
        examRepository,
        dataSource,
        assignmentService,
      } = await setup();

      examRepository.findOne.mockResolvedValue({ id: 1, classId: 5, startDate: new Date('2025-01-01T00:00:00Z') });
      assignmentService.create.mockResolvedValue({
        id: 42,
        classId: 5,
      });

      const driverError: any = new Error(
        'duplicate key value violates unique constraint',
      );
      driverError.code = '23505';
      const dbError: any = new QueryFailedError(
        'INSERT INTO "exam_assignment" ...',
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
        score: 5,
      };

      await expect(
        service.createAssignmentAndLink(1, dto),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(assignmentService.create).toHaveBeenCalledTimes(1);
      expect(manager.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('linkAssignment', () => {
    it('throws NotFoundException when the exam does not exist', async () => {
      const {
        service,
        examRepository,
        examAssignmentRepository,
        assignmentRepository,
      } = await setup();

      examRepository.findOne.mockResolvedValue(null);

      await expect(service.linkAssignment(1, 2, 3)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(examRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(assignmentRepository.findOne).not.toHaveBeenCalled();
      expect(examAssignmentRepository.save).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the assignment does not exist', async () => {
      const {
        service,
        examRepository,
        examAssignmentRepository,
        assignmentRepository,
      } = await setup();

      examRepository.findOne.mockResolvedValue({ id: 1 });
      assignmentRepository.findOne.mockResolvedValue(null);

      await expect(service.linkAssignment(1, 2, 3)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(examRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(assignmentRepository.findOne).toHaveBeenCalledWith({
        where: { id: 2 },
      });
      expect(examAssignmentRepository.save).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when score is 0', async () => {
      const { service, examRepository, examAssignmentRepository } = await setup();

      examRepository.findOne.mockResolvedValue({ id: 1 });

      await expect(service.linkAssignment(1, 2, 0)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(examAssignmentRepository.save).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when score is negative', async () => {
      const { service, examRepository, examAssignmentRepository } = await setup();

      examRepository.findOne.mockResolvedValue({ id: 1 });

      await expect(service.linkAssignment(1, 2, -1)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(examAssignmentRepository.save).not.toHaveBeenCalled();
    });

    it('throws ConflictException when the assignment is already linked (unique violation 23505)', async () => {
      const {
        service,
        examRepository,
        examAssignmentRepository,
        assignmentRepository,
      } = await setup();

      examRepository.findOne.mockResolvedValue({ id: 1 });
      assignmentRepository.findOne.mockResolvedValue({ id: 2 });

      const driverError: any = new Error(
        'duplicate key value violates unique constraint',
      );
      driverError.code = '23505';
      const dbError: any = new QueryFailedError(
        'INSERT INTO "exam_assignment" ...',
        [],
        driverError,
      );
      dbError.code = '23505';
      examAssignmentRepository.save.mockRejectedValue(dbError);

      await expect(service.linkAssignment(1, 2, 3)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(examAssignmentRepository.save).toHaveBeenCalledWith({
        examId: 1,
        assignmentId: 2,
        score: 3,
      });
      expect(examAssignmentRepository.findOneOrFail).not.toHaveBeenCalled();
    });

    it('creates the link and returns it with relations when all checks pass', async () => {
      const {
        service,
        examRepository,
        examAssignmentRepository,
        assignmentRepository,
      } = await setup();

      examRepository.findOne.mockResolvedValue({ id: 1 });
      assignmentRepository.findOne.mockResolvedValue({ id: 2 });
      examAssignmentRepository.save.mockResolvedValue({
        id: 99,
        examId: 1,
        assignmentId: 2,
        score: 3,
      });
      const hydrated = {
        id: 99,
        examId: 1,
        assignmentId: 2,
        score: 3,
        exam: { id: 1, title: 'Midterm' },
        assignment: { id: 2, title: 'Activity 2' },
      };
      examAssignmentRepository.findOneOrFail.mockResolvedValue(hydrated);

      const result = await service.linkAssignment(1, 2, 3);

      expect(examAssignmentRepository.save).toHaveBeenCalledWith({
        examId: 1,
        assignmentId: 2,
        score: 3,
      });
      expect(examAssignmentRepository.findOneOrFail).toHaveBeenCalledWith({
        where: { id: 99 },
        relations: ['exam', 'assignment'],
      });
      expect(result).toEqual(hydrated);
    });
  });

  describe('unlinkAssignment', () => {
    it('throws NotFoundException when the exam does not exist', async () => {
      const {
        service,
        examRepository,
        examAssignmentRepository,
        assignmentRepository,
      } = await setup();

      examRepository.findOne.mockResolvedValue(null);

      await expect(service.unlinkAssignment(1, 2)).rejects.toBeInstanceOf(
        NotFoundException,
      );

      expect(examRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(assignmentRepository.findOne).not.toHaveBeenCalled();
      expect(examAssignmentRepository.findOne).not.toHaveBeenCalled();
      expect(examAssignmentRepository.delete).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the assignment does not exist', async () => {
      const {
        service,
        examRepository,
        examAssignmentRepository,
        assignmentRepository,
      } = await setup();

      examRepository.findOne.mockResolvedValue({ id: 1 });
      assignmentRepository.findOne.mockResolvedValue(null);

      await expect(service.unlinkAssignment(1, 2)).rejects.toBeInstanceOf(
        NotFoundException,
      );

      expect(examRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(assignmentRepository.findOne).toHaveBeenCalledWith({
        where: { id: 2 },
      });
      expect(examAssignmentRepository.findOne).not.toHaveBeenCalled();
      expect(examAssignmentRepository.delete).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the link between exam and assignment does not exist', async () => {
      const {
        service,
        examRepository,
        examAssignmentRepository,
        assignmentRepository,
      } = await setup();

      examRepository.findOne.mockResolvedValue({ id: 1 });
      assignmentRepository.findOne.mockResolvedValue({ id: 2 });
      examAssignmentRepository.findOne.mockResolvedValue(null);

      await expect(service.unlinkAssignment(1, 2)).rejects.toBeInstanceOf(
        NotFoundException,
      );

      expect(examAssignmentRepository.findOne).toHaveBeenCalledWith({
        where: { examId: 1, assignmentId: 2 },
      });
      expect(examAssignmentRepository.delete).not.toHaveBeenCalled();
    });

    it('deletes the link and returns void when exam, assignment and link all exist', async () => {
      const {
        service,
        examRepository,
        examAssignmentRepository,
        assignmentRepository,
      } = await setup();

      examRepository.findOne.mockResolvedValue({ id: 1 });
      assignmentRepository.findOne.mockResolvedValue({ id: 2 });
      examAssignmentRepository.findOne.mockResolvedValue({
        id: 99,
        examId: 1,
        assignmentId: 2,
      });
      examAssignmentRepository.delete.mockResolvedValue({ raw: [], affected: 1 });

      const result = await service.unlinkAssignment(1, 2);

      expect(examAssignmentRepository.findOne).toHaveBeenCalledWith({
        where: { examId: 1, assignmentId: 2 },
      });
      expect(examAssignmentRepository.delete).toHaveBeenCalledWith({ id: 99 });
      expect(result).toBeUndefined();
    });
  });

  describe('updateAssignmentScore', () => {
    it('throws BadRequestException when score is 0', async () => {
      const { service, examRepository, examAssignmentRepository } = await setup();

      await expect(
        service.updateAssignmentScore(1, 2, 0),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(examRepository.findOne).not.toHaveBeenCalled();
      expect(examAssignmentRepository.findOne).not.toHaveBeenCalled();
      expect(examAssignmentRepository.update).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when score is negative', async () => {
      const { service, examRepository, examAssignmentRepository } = await setup();

      await expect(
        service.updateAssignmentScore(1, 2, -1),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(examRepository.findOne).not.toHaveBeenCalled();
      expect(examAssignmentRepository.findOne).not.toHaveBeenCalled();
      expect(examAssignmentRepository.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the exam does not exist', async () => {
      const {
        service,
        examRepository,
        examAssignmentRepository,
        assignmentRepository,
      } = await setup();

      examRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateAssignmentScore(1, 2, 3),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(examRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(assignmentRepository.findOne).not.toHaveBeenCalled();
      expect(examAssignmentRepository.findOne).not.toHaveBeenCalled();
      expect(examAssignmentRepository.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the assignment does not exist', async () => {
      const {
        service,
        examRepository,
        examAssignmentRepository,
        assignmentRepository,
      } = await setup();

      examRepository.findOne.mockResolvedValue({ id: 1 });
      assignmentRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateAssignmentScore(1, 2, 3),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(examRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(assignmentRepository.findOne).toHaveBeenCalledWith({
        where: { id: 2 },
      });
      expect(examAssignmentRepository.findOne).not.toHaveBeenCalled();
      expect(examAssignmentRepository.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the link between exam and assignment does not exist', async () => {
      const {
        service,
        examRepository,
        examAssignmentRepository,
        assignmentRepository,
      } = await setup();

      examRepository.findOne.mockResolvedValue({ id: 1 });
      assignmentRepository.findOne.mockResolvedValue({ id: 2 });
      examAssignmentRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateAssignmentScore(1, 2, 3),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(examAssignmentRepository.findOne).toHaveBeenCalledWith({
        where: { examId: 1, assignmentId: 2 },
      });
      expect(examAssignmentRepository.update).not.toHaveBeenCalled();
      expect(examAssignmentRepository.findOneOrFail).not.toHaveBeenCalled();
    });

    it('updates the score and returns the link with relations when all checks pass', async () => {
      const {
        service,
        examRepository,
        examAssignmentRepository,
        assignmentRepository,
      } = await setup();

      examRepository.findOne.mockResolvedValue({ id: 1 });
      assignmentRepository.findOne.mockResolvedValue({ id: 2 });
      examAssignmentRepository.findOne.mockResolvedValue({
        id: 99,
        examId: 1,
        assignmentId: 2,
        score: 3,
      });
      examAssignmentRepository.update.mockResolvedValue({ raw: [], affected: 1 });

      const hydrated = {
        id: 99,
        examId: 1,
        assignmentId: 2,
        score: 5,
        exam: { id: 1, title: 'Midterm' },
        assignment: { id: 2, title: 'Activity 2' },
      };
      examAssignmentRepository.findOneOrFail.mockResolvedValue(hydrated);

      const result = await service.updateAssignmentScore(1, 2, 5);

      expect(examAssignmentRepository.update).toHaveBeenCalledWith(99, {
        score: 5,
      });
      expect(examAssignmentRepository.findOneOrFail).toHaveBeenCalledWith({
        where: { id: 99 },
        relations: ['exam', 'assignment'],
      });
      expect(result).toEqual(hydrated);
    });
  });

  describe('findOneWithAssignments', () => {
    it('throws NotFoundException when the exam does not exist', async () => {
      const {
        service,
        examRepository,
        examAssignmentRepository,
        requestContextService,
        userClassService,
      } = await setup();

      examRepository.findOne.mockResolvedValue(null);
      requestContextService.getUser.mockReturnValue({
        userId: 7,
        isAdmin: false,
      });

      await expect(service.findOneWithAssignments(123)).rejects.toBeInstanceOf(
        NotFoundException,
      );

      expect(examRepository.findOne).toHaveBeenCalledWith({
        where: { id: 123 },
      });
      expect(requestContextService.getUser).not.toHaveBeenCalled();
      expect(userClassService.findOneByKeys).not.toHaveBeenCalled();
      expect(examAssignmentRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('returns the exam with an empty activities array when there are no linked activities', async () => {
      const {
        service,
        examRepository,
        examAssignmentRepository,
        requestContextService,
        userClassService,
      } = await setup();

      const exam = {
        id: 1,
        title: 'Midterm',
        description: 'Covers chapters 1-5',
        classId: 5,
        dueDate: new Date('2026-08-15T23:59:00Z'),
        startDate: new Date('2025-01-01T00:00:00Z'),
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

      const qb = makeQueryBuilder();
      qb.getMany.mockResolvedValue([]);
      examAssignmentRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findOneWithAssignments(1);

      expect(userClassService.findOneByKeys).toHaveBeenCalledWith(7, 5);
      expect(examAssignmentRepository.createQueryBuilder).toHaveBeenCalledWith(
        'ea',
      );
      expect(qb.innerJoinAndSelect).toHaveBeenCalledWith(
        'ea.assignment',
        'assignment',
      );
      expect(qb.leftJoinAndSelect).toHaveBeenCalledWith(
        'assignment.assignmentAttempts',
        'assignmentAttempts',
        'assignmentAttempts.userId = :userId',
        { userId: 7 },
      );
      expect(qb.where).toHaveBeenCalledWith('ea.examId = :examId', {
        examId: 1,
      });
      expect(qb.orderBy).toHaveBeenCalledWith('ea.id', 'ASC');
      expect(result).toEqual({ exam, assignments: [] });
    });

    it('returns the exam with activities mapped to the summary DTO and ordered by ExamAssignment id', async () => {
      const {
        service,
        examRepository,
        examAssignmentRepository,
        requestContextService,
        userClassService,
      } = await setup();

      const exam = { id: 1, title: 'Midterm', classId: 5, startDate: new Date('2025-01-01T00:00:00Z') };
      examRepository.findOne.mockResolvedValue(exam);
      requestContextService.getUser.mockReturnValue({
        userId: 7,
        isAdmin: false,
      });
      userClassService.findOneByKeys.mockResolvedValue({
        userId: 7,
        classId: 5,
      });

      const assignmentB = {
        id: 20,
        title: 'Activity B',
        description: 'B desc',
        classId: 5,
        maxAttempts: 2,
        workerType: WorkerType.NODE_NESTJS,
        assignmentAttempts: [],
        suspensions: [],
        initSqlScript: 'secret',
        boilerplateFilePath: '/secret',
        interviewConfig: { questions: [] },
      };
      const assignmentA = {
        id: 10,
        title: 'Activity A',
        description: 'A desc',
        classId: 5,
        maxAttempts: 3,
        workerType: WorkerType.NODE_DEFAULT,
        assignmentAttempts: [],
        suspensions: [],
      };

      const qb = makeQueryBuilder();
      qb.getMany.mockResolvedValue([
        { id: 2, examId: 1, assignmentId: 20, score: 5, assignment: assignmentB },
        { id: 1, examId: 1, assignmentId: 10, score: 3, assignment: assignmentA },
      ]);
      examAssignmentRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findOneWithAssignments(1);

      expect(result.exam).toEqual(exam);
      expect(result.assignments).toEqual([
        {
          id: 20,
          title: 'Activity B',
          description: 'B desc',
          classId: 5,
          maxAttempts: 2,
          startDate: null,
          dueDate: null,
          workerType: WorkerType.NODE_NESTJS,
          lastAttempt: null,
          currentUserAlertStatus: {
            activeCount: 0,
            limit: 5,
            suspended: false,
          },
          score: 5,
        },
        {
          id: 10,
          title: 'Activity A',
          description: 'A desc',
          classId: 5,
          maxAttempts: 3,
          startDate: null,
          dueDate: null,
          workerType: WorkerType.NODE_DEFAULT,
          lastAttempt: null,
          currentUserAlertStatus: {
            activeCount: 0,
            limit: 5,
            suspended: false,
          },
          score: 3,
        },
      ]);
      expect(result.assignments[0]).not.toHaveProperty('initSqlScript');
      expect(result.assignments[0]).not.toHaveProperty('boilerplateFilePath');
      expect(result.assignments[0]).not.toHaveProperty('interviewConfig');
      expect(qb.andWhere).toHaveBeenCalledWith(
        '(assignment.startDate IS NULL OR assignment.startDate <= :now)',
        expect.objectContaining({ now: expect.any(Date) }),
      );
    });

    it('skips the enrollment check when the user is an admin', async () => {
      const {
        service,
        examRepository,
        examAssignmentRepository,
        requestContextService,
        userClassService,
      } = await setup();

      examRepository.findOne.mockResolvedValue({ id: 1, classId: 5, startDate: new Date('2025-01-01T00:00:00Z') });
      requestContextService.getUser.mockReturnValue({
        userId: 7,
        isAdmin: true,
      });

      const qb = makeQueryBuilder();
      qb.getMany.mockResolvedValue([]);
      examAssignmentRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findOneWithAssignments(1);

      expect(userClassService.findOneByKeys).not.toHaveBeenCalled();
      expect(result).toEqual({ exam: { id: 1, classId: 5, startDate: new Date('2025-01-01T00:00:00Z') }, assignments: [] });
    });

    it('throws ForbiddenException when a non-admin user is not enrolled in the exam class', async () => {
      const {
        service,
        examRepository,
        examAssignmentRepository,
        requestContextService,
        userClassService,
      } = await setup();

      examRepository.findOne.mockResolvedValue({ id: 1, classId: 5, startDate: new Date('2025-01-01T00:00:00Z') });
      requestContextService.getUser.mockReturnValue({
        userId: 7,
        isAdmin: false,
      });
      userClassService.findOneByKeys.mockResolvedValue(null);

      await expect(service.findOneWithAssignments(1)).rejects.toBeInstanceOf(
        ForbiddenException,
      );

      expect(userClassService.findOneByKeys).toHaveBeenCalledWith(7, 5);
      expect(examAssignmentRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when a non-admin user tries to view an exam without a class', async () => {
      const {
        service,
        examRepository,
        examAssignmentRepository,
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

      await expect(service.findOneWithAssignments(1)).rejects.toBeInstanceOf(
        ForbiddenException,
      );

      expect(userClassService.findOneByKeys).not.toHaveBeenCalled();
      expect(examAssignmentRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('populates lastAttempt with the user’s latest attempt for each activity and null otherwise', async () => {
      const {
        service,
        examRepository,
        examAssignmentRepository,
        requestContextService,
        userClassService,
      } = await setup();

      const exam = { id: 1, title: 'Midterm', classId: 5, startDate: new Date('2025-01-01T00:00:00Z') };
      examRepository.findOne.mockResolvedValue(exam);
      requestContextService.getUser.mockReturnValue({
        userId: 7,
        isAdmin: false,
      });
      userClassService.findOneByKeys.mockResolvedValue({
        userId: 7,
        classId: 5,
      });

      const createdAtLater = new Date('2026-08-16T12:00:00Z');
      const createdAtEarly = new Date('2026-08-15T12:00:00Z');
      const attemptA1 = {
        id: 100,
        attempt: 1,
        status: AttemptStatus.RUNNING,
        score: null,
        isAcceptable: null,
        passes: null,
        fails: null,
        userId: 7,
        createdAt: createdAtEarly,
      };
      const attemptA2 = {
        id: 101,
        attempt: 2,
        status: AttemptStatus.COMPLETED,
        score: 85,
        isAcceptable: true,
        passes: 3,
        fails: 1,
        userId: 7,
        createdAt: createdAtLater,
      };
      const assignmentA = {
        id: 10,
        title: 'Activity A',
        description: 'A desc',
        classId: 5,
        maxAttempts: 3,
        workerType: WorkerType.NODE_DEFAULT,
        assignmentAttempts: [attemptA2, attemptA1],
        suspensions: [],
      };
      const assignmentB = {
        id: 20,
        title: 'Activity B',
        description: 'B desc',
        classId: 5,
        maxAttempts: 2,
        workerType: WorkerType.NODE_NESTJS,
        assignmentAttempts: [],
        suspensions: [],
      };

      const qb = makeQueryBuilder();
      qb.getMany.mockResolvedValue([
        { id: 1, examId: 1, assignmentId: 10, score: 3, assignment: assignmentA },
        { id: 2, examId: 1, assignmentId: 20, score: 5, assignment: assignmentB },
      ]);
      examAssignmentRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findOneWithAssignments(1);

      expect(result.assignments[0].lastAttempt).toEqual({
        id: 101,
        attempt: 2,
        status: AttemptStatus.COMPLETED,
        score: 85,
        isAcceptable: true,
        passes: 3,
        fails: 1,
        createdAt: createdAtLater,
      });
      expect(result.assignments[0].currentUserAlertStatus).toEqual({
        activeCount: 0,
        limit: 5,
        suspended: false,
      });
      expect(result.assignments[0].score).toBe(3);
      expect(result.assignments[1].lastAttempt).toBeNull();
      expect(result.assignments[1].currentUserAlertStatus).toEqual({
        activeCount: 0,
        limit: 5,
        suspended: false,
      });
      expect(result.assignments[1].score).toBe(5);
    });

    it('sets lastAttempt to null when the user has no attempts for an activity', async () => {
      const {
        service,
        examRepository,
        examAssignmentRepository,
        requestContextService,
        userClassService,
      } = await setup();

      examRepository.findOne.mockResolvedValue({ id: 1, classId: 5, startDate: new Date('2025-01-01T00:00:00Z') });
      requestContextService.getUser.mockReturnValue({
        userId: 7,
        isAdmin: false,
      });
      userClassService.findOneByKeys.mockResolvedValue({
        userId: 7,
        classId: 5,
      });

      const assignmentA = {
        id: 10,
        title: 'Activity A',
        classId: 5,
        maxAttempts: 3,
        workerType: WorkerType.NODE_DEFAULT,
        assignmentAttempts: [],
        suspensions: [],
      };

      const qb = makeQueryBuilder();
      qb.getMany.mockResolvedValue([
        { id: 1, examId: 1, assignmentId: 10, score: 3, assignment: assignmentA },
      ]);
      examAssignmentRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findOneWithAssignments(1);

      expect(result.assignments[0].lastAttempt).toBeNull();
    });

    it('sets a clear alert status when the user has no active alerts', async () => {
      const {
        service,
        examRepository,
        examAssignmentRepository,
        requestContextService,
        userClassService,
      } = await setup();

      examRepository.findOne.mockResolvedValue({ id: 1, classId: 5, startDate: new Date('2025-01-01T00:00:00Z') });
      requestContextService.getUser.mockReturnValue({
        userId: 7,
        isAdmin: false,
      });
      userClassService.findOneByKeys.mockResolvedValue({
        userId: 7,
        classId: 5,
      });

      const assignmentA = {
        id: 10,
        title: 'Activity A',
        classId: 5,
        maxAttempts: 3,
        workerType: WorkerType.NODE_DEFAULT,
        assignmentAttempts: [],
        suspensions: [],
      };

      const qb = makeQueryBuilder();
      qb.getMany.mockResolvedValue([
        { id: 1, examId: 1, assignmentId: 10, score: 3, assignment: assignmentA },
      ]);
      examAssignmentRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findOneWithAssignments(1);

      expect(result.assignments[0].currentUserAlertStatus).toEqual({
        activeCount: 0,
        limit: 5,
        suspended: false,
      });
    });

    it('populates the current alert status for an activity', async () => {
      const {
        service,
        examRepository,
        examAssignmentRepository,
        requestContextService,
        userClassService,
      } = await setup();

      examRepository.findOne.mockResolvedValue({ id: 1, classId: 5, startDate: new Date('2025-01-01T00:00:00Z') });
      requestContextService.getUser.mockReturnValue({
        userId: 7,
        isAdmin: false,
      });
      userClassService.findOneByKeys.mockResolvedValue({
        userId: 7,
        classId: 5,
      });

      const assignmentA = {
        id: 10,
        title: 'Activity A',
        classId: 5,
        maxAttempts: 3,
        workerType: WorkerType.NODE_DEFAULT,
        assignmentAttempts: [],
        currentUserAlertStatus: {
          activeCount: 5,
          limit: 5,
          suspended: true,
        },
      };

      const qb = makeQueryBuilder();
      qb.getMany.mockResolvedValue([
        { id: 1, examId: 1, assignmentId: 10, score: 3, assignment: assignmentA },
      ]);
      examAssignmentRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findOneWithAssignments(1);

      expect(result.assignments[0].currentUserAlertStatus).toEqual({
        activeCount: 5,
        limit: 5,
        suspended: true,
      });
    });

    it('issues exactly one query regardless of how many activities the exam has (N+1 guard)', async () => {
      const {
        service,
        examRepository,
        examAssignmentRepository,
        requestContextService,
        userClassService,
      } = await setup();

      examRepository.findOne.mockResolvedValue({ id: 1, classId: 5, startDate: new Date('2025-01-01T00:00:00Z') });
      requestContextService.getUser.mockReturnValue({
        userId: 7,
        isAdmin: false,
      });
      userClassService.findOneByKeys.mockResolvedValue({
        userId: 7,
        classId: 5,
      });

      const qb = makeQueryBuilder();
      qb.getMany.mockResolvedValue([
        {
          id: 1,
          examId: 1,
          assignmentId: 10,
          score: 3,
          assignment: {
            id: 10,
            assignmentAttempts: [],
            suspensions: [],
          },
        },
        {
          id: 2,
          examId: 1,
          assignmentId: 20,
          score: 5,
          assignment: {
            id: 20,
            assignmentAttempts: [],
            suspensions: [],
          },
        },
        {
          id: 3,
          examId: 1,
          assignmentId: 30,
          score: 2,
          assignment: {
            id: 30,
            assignmentAttempts: [],
            suspensions: [],
          },
        },
      ]);
      examAssignmentRepository.createQueryBuilder.mockReturnValue(qb);

      await service.findOneWithAssignments(1);

      expect(examAssignmentRepository.createQueryBuilder).toHaveBeenCalledTimes(
        1,
      );
      expect(qb.getMany).toHaveBeenCalledTimes(1);
    });

    it('filters lastAttempt by the authenticated user only and does not leak another user’s attempt', async () => {
      const {
        service,
        examRepository,
        examAssignmentRepository,
        requestContextService,
        userClassService,
      } = await setup();

      examRepository.findOne.mockResolvedValue({ id: 1, classId: 5, startDate: new Date('2025-01-01T00:00:00Z') });
      requestContextService.getUser.mockReturnValue({
        userId: 7,
        isAdmin: false,
      });
      userClassService.findOneByKeys.mockResolvedValue({
        userId: 7,
        classId: 5,
      });

      const assignmentA = {
        id: 10,
        title: 'Activity A',
        classId: 5,
        maxAttempts: 3,
        workerType: WorkerType.NODE_DEFAULT,
        assignmentAttempts: [],
        suspensions: [],
      };

      const qb = makeQueryBuilder();
      qb.getMany.mockResolvedValue([
        { id: 1, examId: 1, assignmentId: 10, score: 3, assignment: assignmentA },
      ]);
      examAssignmentRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findOneWithAssignments(1);

      expect(result.assignments[0].lastAttempt).toBeNull();
    });

    it('returns only the authenticated user alert status', async () => {
      const {
        service,
        examRepository,
        examAssignmentRepository,
        requestContextService,
        userClassService,
      } = await setup();

      examRepository.findOne.mockResolvedValue({ id: 1, classId: 5, startDate: new Date('2025-01-01T00:00:00Z') });
      requestContextService.getUser.mockReturnValue({
        userId: 7,
        isAdmin: false,
      });
      userClassService.findOneByKeys.mockResolvedValue({
        userId: 7,
        classId: 5,
      });

      const assignmentA = {
        id: 10,
        title: 'Activity A',
        classId: 5,
        maxAttempts: 3,
        workerType: WorkerType.NODE_DEFAULT,
        assignmentAttempts: [],
        suspensions: [],
      };

      const qb = makeQueryBuilder();
      qb.getMany.mockResolvedValue([
        { id: 1, examId: 1, assignmentId: 10, score: 3, assignment: assignmentA },
      ]);
      examAssignmentRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findOneWithAssignments(1);

      expect(result.assignments[0].currentUserAlertStatus).toEqual({
        activeCount: 0,
        limit: 5,
        suspended: false,
      });
    });

    describe('startDate visibility filter', () => {
      const buildExam = (overrides = {}) => ({
        id: 1,
        title: 'Exam',
        classId: 5,
        startDate: null,
        ...overrides,
      });

      const makeQbWithAssignments = () => {
        const qb = makeQueryBuilder();
        qb.getMany.mockResolvedValue([]);
        return qb;
      };

      it('throws NotFoundException when startDate is null (student)', async () => {
        const {
          service,
          examRepository,
          requestContextService,
          userClassService,
        } = await setup();

        examRepository.findOne.mockResolvedValue(buildExam());
        requestContextService.getUser.mockReturnValue({
          userId: 7,
          isAdmin: false,
        });
        userClassService.findOneByKeys.mockResolvedValue({
          userId: 7,
          classId: 5,
        });

        await expect(
          service.findOneWithAssignments(1),
        ).rejects.toBeInstanceOf(NotFoundException);
      });

      it('returns the exam when startDate is in the past (student)', async () => {
        const {
          service,
          examRepository,
          examAssignmentRepository,
          requestContextService,
          userClassService,
        } = await setup();

        examRepository.findOne.mockResolvedValue(
          buildExam({
            startDate: new Date('2025-01-01T00:00:00Z'),
          }),
        );
        requestContextService.getUser.mockReturnValue({
          userId: 7,
          isAdmin: false,
        });
        userClassService.findOneByKeys.mockResolvedValue({
          userId: 7,
          classId: 5,
        });
        examAssignmentRepository.createQueryBuilder.mockReturnValue(
          makeQbWithAssignments(),
        );

        const result = await service.findOneWithAssignments(1);

        expect(result.exam).toBeDefined();
      });

      it('throws NotFoundException when startDate is in the future (student)', async () => {
        const {
          service,
          examRepository,
          requestContextService,
          userClassService,
        } = await setup();

        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);
        examRepository.findOne.mockResolvedValue(
          buildExam({ startDate: futureDate }),
        );
        requestContextService.getUser.mockReturnValue({
          userId: 7,
          isAdmin: false,
        });
        userClassService.findOneByKeys.mockResolvedValue({
          userId: 7,
          classId: 5,
        });

        await expect(
          service.findOneWithAssignments(1),
        ).rejects.toBeInstanceOf(NotFoundException);
      });

      it('returns the exam when startDate is in the future but user is admin', async () => {
        const {
          service,
          examRepository,
          examAssignmentRepository,
          requestContextService,
        } = await setup();

        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);
        examRepository.findOne.mockResolvedValue(
          buildExam({ startDate: futureDate }),
        );
        requestContextService.getUser.mockReturnValue({
          userId: 1,
          isAdmin: true,
        });
        examAssignmentRepository.createQueryBuilder.mockReturnValue(
          makeQbWithAssignments(),
        );

        const result = await service.findOneWithAssignments(1);

        expect(result.exam).toBeDefined();
      });
    });
  });
});
