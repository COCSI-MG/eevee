import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { Brackets, DataSource } from 'typeorm';
import { AssignmentService } from './assignment.service';
import { Assignment } from './entities/assignment.entity';
import { AssignmentParam } from 'src/assignment-params/entities/assignment-param.entity';
import { AssignmentTemplate } from 'src/assignment-template/entities/assignment-template.entity';
import { Attempt } from 'src/attempt/entities/attempt.entity';
import { ClassService } from 'src/class/class.service';
import { RequestContextService } from 'src/request-context/request-context.service';
import { Template } from 'src/template/entities/template.entity';
import { UserClass } from 'src/user-class/entities/user-class.entity';
import { WorkerType } from 'src/worker/enum/worker-type.enum';
import { AssignmentAlertService } from 'src/assignment-alert/assignment-alert.service';
import { AssignmentAlertType } from 'src/assignment-alert/enums/assignment-alert-type.enum';

describe('AssignmentService', () => {
  let service: AssignmentService;

  const createRepositoryMock = () => ({
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  });

  const setup = async () => {
    const assignmentRepository = createRepositoryMock();
    const assignmentTemplateRepository = createRepositoryMock();
    const assignmentParamsRepository = createRepositoryMock();
    const templateRepository = createRepositoryMock();
    const userClassRepository = createRepositoryMock();
    const attemptRepository = createRepositoryMock();
    const classService = { findOne: jest.fn() };
    const dataSource = { transaction: jest.fn() };
    const requestContextService = {
      getUser: jest.fn(),
    };
    const assignmentAlertService = {
      decorateAssignments: jest.fn(async (assignments) => assignments),
      replaceRules: jest.fn(),
      assertCurrentUserNotSuspended: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssignmentService,
        {
          provide: getRepositoryToken(Assignment),
          useValue: assignmentRepository,
        },
        {
          provide: getRepositoryToken(AssignmentTemplate),
          useValue: assignmentTemplateRepository,
        },
        {
          provide: getRepositoryToken(AssignmentParam),
          useValue: assignmentParamsRepository,
        },
        {
          provide: getRepositoryToken(Template),
          useValue: templateRepository,
        },
        {
          provide: getRepositoryToken(UserClass),
          useValue: userClassRepository,
        },
        {
          provide: getRepositoryToken(Attempt),
          useValue: attemptRepository,
        },
        {
          provide: ClassService,
          useValue: classService,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
        {
          provide: RequestContextService,
          useValue: requestContextService,
        },
        {
          provide: AssignmentAlertService,
          useValue: assignmentAlertService
        }
      ],
    }).compile();

    return {
      service: module.get<AssignmentService>(AssignmentService),
      assignmentRepository,
      assignmentTemplateRepository,
      assignmentParamsRepository,
      templateRepository,
      userClassRepository,
      attemptRepository,
      classService,
      dataSource,
      requestContextService,
      assignmentAlertService
    };
  };

  beforeEach(async () => {
    ({ service } = await setup());
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('loads assignment details for execution without request context', async () => {
    const { service, assignmentRepository, requestContextService } =
      await setup();
    const assignment = { id: 42 } as Assignment;
    const query = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(assignment),
    };
    assignmentRepository.createQueryBuilder.mockReturnValue(query);
    jest
      .spyOn(service as any, 'attachBoilerplate')
      .mockResolvedValue(assignment);

    await expect(service.findOneForExecution(42)).resolves.toBe(assignment);

    expect(query.where).toHaveBeenCalledWith('assignment.id = :id', {
      id: 42,
    });
    expect(query.leftJoinAndSelect).toHaveBeenCalledWith(
      'template.templateParams',
      'templateParams',
    );
    expect(requestContextService.getUser).not.toHaveBeenCalled();
  });

  it('returns every assignment for an admin without filtering by creator', async () => {
    const { service, assignmentRepository, requestContextService } =
      await setup();
    assignmentRepository.find.mockResolvedValue([
      { id: 1, createdById: 10, boilerplateContent: '' },
      { id: 2, createdById: 20, boilerplateContent: '' },
    ]);

    await expect(service.findAll()).resolves.toEqual([
      expect.objectContaining({ id: 1, createdById: 10 }),
      expect.objectContaining({ id: 2, createdById: 20 }),
    ]);

    expect(assignmentRepository.find).toHaveBeenCalledWith({
      relations: ['assignmentAttempts', 'class', 'class.userClasses']
    });
    expect(requestContextService.getUser).not.toHaveBeenCalled();
  });

  it('lists lightweight assignment options filtered by class', async () => {
    const { service, assignmentRepository } = await setup();
    assignmentRepository.find.mockResolvedValue([
      { id: 1, title: 'Activity', classId: 5 },
    ]);

    await expect(service.findOptions(5)).resolves.toEqual([
      { id: 1, title: 'Activity', classId: 5 },
    ]);
    expect(assignmentRepository.find).toHaveBeenCalledWith({
      select: { id: true, title: true, classId: true },
      where: { classId: 5 },
      order: { title: 'ASC', id: 'ASC' },
    });
  });

  it('uses the global assignment list for the admin me endpoint', async () => {
    const { service, assignmentRepository, requestContextService } =
      await setup();
    const assignments = [{ id: 1 }, { id: 2 }] as Assignment[];
    requestContextService.getUser.mockReturnValue({
      userId: 10,
      isAdmin: true,
    });
    jest.spyOn(service, 'findAll').mockResolvedValue(assignments as any);

    await expect(service.findAllUserAssignments()).resolves.toBe(assignments);

    expect(service.findAll).toHaveBeenCalledTimes(1);
    expect(assignmentRepository.createQueryBuilder).not.toHaveBeenCalled();
  });

  describe('project import from submitted attempts', () => {
    it('lists compatible assignments with submitted work in title order', async () => {
      const { service, assignmentRepository, requestContextService } = await setup();

      const firstSubmittedAt = new Date('2026-09-01T12:00:00.000Z');
      const secondSubmittedAt = new Date('2026-09-02T12:00:00.000Z');

      const query = {
        innerJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          {
            id: '2',
            title: 'Atividade A',
            submittedAt: firstSubmittedAt
          },
          {
            id: '3',
            title: 'Atividade B',
            submittedAt: secondSubmittedAt
          }
        ])
      };
      requestContextService.getUser.mockReturnValue({ userId: 7, isAdmin: false });
      jest.spyOn(service, 'findOne').mockResolvedValue({ id: 5, classId: 12, workerType: WorkerType.NODE_DEFAULT, allowProjectImport: true } as any)

      assignmentRepository.createQueryBuilder.mockReturnValue(query)

      await expect(service.findImportSources(5)).resolves.toEqual([
        {
          id: 2,
          title: 'Atividade A',
          submittedAt: firstSubmittedAt
        },
        {
          id: 3,
          title: 'Atividade B',
          submittedAt: secondSubmittedAt
        }
      ]);

      expect(query.where).toHaveBeenCalledWith('source.classId = :classId', { classId: 12 });

      expect(query.innerJoin).toHaveBeenCalledWith(
        'source.assignmentAttempts',
        'attempt',
        'attempt.userId = :userId AND attempt.receivedWork IS NOT NULL',
        { userId: 7 }
      );
      expect(query.andWhere).toHaveBeenCalledWith(
        'source.workerType = :workerType',
        { workerType: WorkerType.NODE_DEFAULT }
      );
      expect(query.andWhere).toHaveBeenCalledWith(
        'source.id != :destinationAssignmentId',
        { destinationAssignmentId: 5 }
      );
      expect(query.orderBy).toHaveBeenCalledWith('LOWER(source.title)', 'ASC');
      expect(query.addSelect).toHaveBeenCalledWith(
        'MAX(attempt.createdAt)',
        'submittedAt'
      );
    });

    it('rejects import source listing when the destination disallows it', async () => {
      const { service, assignmentRepository } = await setup();
      jest.spyOn(service, 'findOne').mockResolvedValue({ id: 5, allowProjectImport: false } as any);

      await expect(service.findImportSources(5)).rejects.toBeInstanceOf(ForbiddenException);
      expect(assignmentRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('returns the latest submitted work for the current user', async () => {
      const {
        service,
        assignmentRepository,
        attemptRepository,
        requestContextService
      } = await setup();
      const submittedAt = new Date('2026-09-02T12:00:00.000Z')

      const files = { 'src/app.ts': 'export const value = 1;' }

      requestContextService.getUser.mockReturnValue({ userId: 7, isAdmin: false });
      jest.spyOn(service, 'findOne').mockResolvedValue({ id: 5, classId: 12, workerType: WorkerType.NODE_DEFAULT, allowProjectImport: true } as any);

      assignmentRepository.findOne.mockResolvedValue({ id: 2, title: 'Origem', classId: 12, workerType: WorkerType.NODE_DEFAULT });
      attemptRepository.findOne.mockResolvedValue({ assignmentId: 2, userId: 7, attempt: 3, receivedWork: files, createdAt: submittedAt });

      await expect(service.findImportSource(5, 2)).resolves.toEqual({ id: 2, title: 'Origem', files, submittedAt });

      expect(attemptRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ assignmentId: 2, userId: 7 }),
          order: { attempt: 'DESC' },
        }),
      );
    });

    it('rejects a source from another class or worker', async () => {
      const { service, assignmentRepository, attemptRepository } = await setup();

      jest.spyOn(service, 'findOne').mockResolvedValue({ id: 5, classId: 12, workerType: WorkerType.NODE_DEFAULT, allowProjectImport: true } as any)
      assignmentRepository.findOne.mockResolvedValue({ id: 2, title: 'Origem', classId: 99, workerType: WorkerType.NODE_DEFAULT })

      await expect(service.findImportSource(5, 2)).rejects.toBeInstanceOf( BadRequestException)
      expect(attemptRepository.findOne).not.toHaveBeenCalled()
    });

    it('rejects a compatible source without submitted work', async () => {
      const {
        service,
        assignmentRepository,
        attemptRepository,
        requestContextService
      } = await setup();
      requestContextService.getUser.mockReturnValue({userId: 7, isAdmin: false})
      jest.spyOn(service, 'findOne').mockResolvedValue({id: 5, classId: 12, workerType: WorkerType.NODE_DEFAULT, allowProjectImport: true} as any)
      assignmentRepository.findOne.mockResolvedValue({id: 2, title: 'Origem', classId: 12, workerType: WorkerType.NODE_DEFAULT })
      attemptRepository.findOne.mockResolvedValue(null);

      await expect(service.findImportSource(5, 2)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  it('create throws when class does not exist', async () => {
    const {
      service,
      classService,
      assignmentRepository,
      requestContextService,
    } = await setup();

    classService.findOne.mockResolvedValue(null);
    requestContextService.getUser.mockReturnValue({
      userId: 7,
      isAdmin: false,
    });

    await expect(
      service.create({
        classId: 12,
        title: 'Assignment',
        description: 'Desc',
        maxAttempts: 3,
        workerType: WorkerType.NODE_DEFAULT,
        validationScript: undefined as any,
        templates: [],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(classService.findOne).toHaveBeenCalledWith(12);
    expect(assignmentRepository.save).not.toHaveBeenCalled();
  });

  it('create persists assignment and relation rows when templates are valid', async () => {
    const {
      service,
      classService,
      assignmentRepository,
      assignmentTemplateRepository,
      assignmentParamsRepository,
      templateRepository,
      requestContextService,
      assignmentAlertService
    } = await setup();

    classService.findOne.mockResolvedValue({ id: 12 });
    requestContextService.getUser.mockReturnValue({
      userId: 7,
      isAdmin: false,
    });
    assignmentRepository.save.mockResolvedValue({
      id: 99,
      boilerplateContent: 'console.log("hi");',
      allowCopyPaste: true,
    });
    templateRepository.find.mockResolvedValue([
      { id: 1, workerType: WorkerType.NODE_DEFAULT },
      { id: 2, workerType: WorkerType.NODE_DEFAULT },
    ]);
    assignmentTemplateRepository.save.mockResolvedValue([]);
    assignmentParamsRepository.save.mockResolvedValue([]);

    const result = await service.create({
      classId: 12,
      title: 'Assignment',
      description: 'Desc',
      maxAttempts: 3,
      allowCopyPaste: true,
      workerType: WorkerType.NODE_DEFAULT,
      validationScript: undefined as any,
      boilerplateContent: 'console.log("hi");',
      allowProjectImport: true,
      templates: [
        {
          templateId: 1,
          params: [
            { templateParamId: 10, value: 'first' },
            { templateParamId: 11, value: 'second' },
          ],
        },
        {
          templateId: 2,
          params: [{ templateParamId: 12, value: 'third' }],
        },
      ],
    });

    expect(classService.findOne).toHaveBeenCalledWith(12);
    expect(assignmentRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        classId: 12,
        title: 'Assignment',
        description: 'Desc',
        maxAttempts: 3,
        allowCopyPaste: true,
        workerType: WorkerType.NODE_DEFAULT,
        boilerplateContent: 'console.log("hi");',
        allowProjectImport: true,
        createdById: 7,
        suspensionAlertLimit: 5,
        typingCharactersPerSecondLimit: 20,
        alertPolicyVersion: 1
      }),
    );
    expect(assignmentAlertService.replaceRules).toHaveBeenCalledWith(
      99,
      [
        AssignmentAlertType.WINDOW_FOCUS_LOSS,
        AssignmentAlertType.DEVTOOLS,
        AssignmentAlertType.CLIPBOARD,
        AssignmentAlertType.TYPING_RATE
      ],
      undefined
    );
    expect(templateRepository.find).toHaveBeenCalledTimes(1);
    expect(assignmentTemplateRepository.save).toHaveBeenCalledWith([
      { assignmentId: 99, templateId: 1, weight: 50 },
      { assignmentId: 99, templateId: 2, weight: 50 },
    ]);
    expect(assignmentParamsRepository.save).toHaveBeenCalledWith([
      { assignmentId: 99, templateParamsId: 10, value: 'first' },
      { assignmentId: 99, templateParamsId: 11, value: 'second' },
      { assignmentId: 99, templateParamsId: 12, value: 'third' },
    ]);
    expect(result).toMatchObject({
      id: 99,
      boilerplateContent: 'console.log("hi");',
      boilerplate: 'console.log("hi");',
      validationScript: 'console.log("hi");',
      allowCopyPaste: true,
    });
  });

  it('create throws when a template is missing', async () => {
    const {
      service,
      classService,
      assignmentRepository,
      templateRepository,
      requestContextService,
    } = await setup();

    classService.findOne.mockResolvedValue({ id: 12 });
    requestContextService.getUser.mockReturnValue({
      userId: 7,
      isAdmin: false,
    });
    assignmentRepository.save.mockResolvedValue({
      id: 99,
      boilerplateContent: 'content',
    });
    templateRepository.find.mockResolvedValue([]);

    await expect(
      service.create({
        classId: 12,
        title: 'Assignment',
        description: 'Desc',
        maxAttempts: 3,
        workerType: WorkerType.NODE_DEFAULT,
        validationScript: undefined as any,
        templates: [
          {
            templateId: 404,
            params: [],
          },
        ],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(assignmentRepository.save).toHaveBeenCalledTimes(1);
    expect(templateRepository.find).toHaveBeenCalledTimes(1);
  });

  it('create throws when template workerType is incompatible', async () => {
    const {
      service,
      classService,
      assignmentRepository,
      templateRepository,
      assignmentTemplateRepository,
      assignmentParamsRepository,
      requestContextService,
    } = await setup();

    classService.findOne.mockResolvedValue({ id: 12 });
    requestContextService.getUser.mockReturnValue({
      userId: 7,
      isAdmin: false,
    });
    assignmentRepository.save.mockResolvedValue({
      id: 99,
      boilerplateContent: 'content',
    });
    templateRepository.find.mockResolvedValue([
      { id: 404, workerType: WorkerType.NODE_NESTJS },
    ]);

    await expect(
      service.create({
        classId: 12,
        title: 'Assignment',
        description: 'Desc',
        maxAttempts: 3,
        workerType: WorkerType.NODE_DEFAULT,
        validationScript: undefined as any,
        templates: [
          {
            templateId: 404,
            params: [],
          },
        ],
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(assignmentRepository.save).toHaveBeenCalledTimes(1);
    expect(assignmentTemplateRepository.save).not.toHaveBeenCalled();
    expect(assignmentParamsRepository.save).not.toHaveBeenCalled();
  });

  it('remove blocks deletion when attempts already exist', async () => {
    const {
      service,
      assignmentRepository,
      attemptRepository,
      dataSource,
      requestContextService,
    } = await setup();

    requestContextService.getUser.mockReturnValue({
      userId: 7,
      isAdmin: false,
    });
    assignmentRepository.findOne.mockResolvedValue({
      id: 55,
      createdById: 7,
    });
    attemptRepository.count.mockResolvedValue(2);

    await expect(service.remove(55)).rejects.toBeInstanceOf(ConflictException);

    expect(assignmentRepository.findOne).toHaveBeenCalledWith({
      where: { id: 55 },
    });
    expect(attemptRepository.count).toHaveBeenCalledWith({
      where: { assignmentId: 55 },
    });
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  describe('findAllPaginated', () => {
    const makeQueryBuilder = () => {
      const qb: Record<string, jest.Mock> = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        clone: jest.fn(),
        getManyAndCount: jest.fn(),
      };
      qb.clone.mockReturnValue(qb);
      return qb;
    };

    it('paginates assignments with search across title, class.name and workerType', async () => {
      const { service, assignmentRepository, requestContextService } =
        await setup();
      const qb = makeQueryBuilder();
      qb.getManyAndCount.mockResolvedValue([
        [
          {
            id: 1,
            title: 'Assignment One',
            class: { id: 2, name: 'Math' },
            workerType: 'worker-a',
            assignmentAttempts: [],
            suspensions: [],
          },
        ],
        1,
      ]);
      assignmentRepository.createQueryBuilder.mockReturnValue(qb);
      requestContextService.getUser.mockReturnValue({
        userId: 10,
        isAdmin: true,
      });
      jest
        .spyOn(service as any, 'attachBoilerplate')
        .mockImplementation(async (assignment) => assignment);

      const result = await service.findAllPaginated({
        search: 'one',
        page: 1,
        pageSize: 10,
      } as any);

      expect(qb.skip).toHaveBeenCalledWith(0);
      expect(qb.take).toHaveBeenCalledWith(10);
      expect(qb.leftJoin).toHaveBeenCalledWith(
        'assignment.examAssignment',
        'examAssignment',
      );
      expect(qb.where).not.toHaveBeenCalled();
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      });
    });

    it('filters assignments by class and combines it with search', async () => {
      const { service, assignmentRepository } = await setup();
      const qb = makeQueryBuilder();
      qb.getManyAndCount.mockResolvedValue([[], 0]);
      assignmentRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAllPaginated({
        classId: 8,
        search: 'node',
        page: 2,
        pageSize: 10
      });

      expect(qb.andWhere).toHaveBeenCalledWith(
        'assignment.classId = :classId',
        { classId: 8 }
      );
      expect(qb.andWhere).toHaveBeenCalledWith(expect.any(Brackets));
      expect(qb.skip).toHaveBeenCalledWith(10);
      expect(qb.take).toHaveBeenCalledWith(10);
      expect(result).toEqual({
        data: [],
        meta: {
          total: 0,
          page: 2,
          pageSize: 10,
          totalPages: 1
        }
      });
    });
  });

  describe('findAssignmentsByClass', () => {
    const makeFindQueryBuilder = () => {
      const qb: Record<string, jest.Mock> = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      return qb;
    };

    it('always filters to assignments not linked to an exam', async () => {
      const {
        service,
        assignmentRepository,
        userClassRepository,
        requestContextService,
      } = await setup();

      requestContextService.getUser.mockReturnValue({
        userId: 7,
        isAdmin: false,
      });
      userClassRepository.findOne.mockResolvedValue({ userId: 7, classId: 1 });
      const qb = makeFindQueryBuilder();
      assignmentRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAssignmentsByClass(1);

      expect(qb.leftJoin).toHaveBeenCalledWith(
        'assignment.examAssignment',
        'examAssignment',
      );
      expect(qb.andWhere).toHaveBeenCalledWith('examAssignment.id IS NULL');
      expect(result).toEqual([]);
    });

    it('throws ForbiddenException for a non-admin user not enrolled in the class', async () => {
      const {
        service,
        assignmentRepository,
        userClassRepository,
        requestContextService,
      } = await setup();

      requestContextService.getUser.mockReturnValue({
        userId: 7,
        isAdmin: false,
      });
      userClassRepository.findOne.mockResolvedValue(null);

      await expect(service.findAssignmentsByClass(1)).rejects.toBeInstanceOf(
        ForbiddenException,
      );

      expect(assignmentRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('allows an admin to list every assignment in the class', async () => {
      const {
        service,
        assignmentRepository,
        userClassRepository,
        requestContextService,
      } = await setup();

      requestContextService.getUser.mockReturnValue({
        userId: 10,
        isAdmin: true,
      });
      userClassRepository.findOne.mockResolvedValue({ userId: 10, classId: 1 });
      const qb = makeFindQueryBuilder();
      assignmentRepository.createQueryBuilder.mockReturnValue(qb);

      await service.findAssignmentsByClass(1);

      expect(userClassRepository.findOne).not.toHaveBeenCalled();
      expect(qb.andWhere).toHaveBeenCalledWith('examAssignment.id IS NULL');
      expect(qb.andWhere).toHaveBeenCalledTimes(1);
    });
  });

  it('allows an admin to open an assignment created by another admin', async () => {
    const { service, assignmentRepository, requestContextService } =
      await setup();
    const assignment = {
      id: 42,
      createdById: 20,
      boilerplateContent: '',
    } as Assignment;
    const query = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(assignment),
    };
    assignmentRepository.createQueryBuilder.mockReturnValue(query);
    requestContextService.getUser.mockReturnValue({
      userId: 10,
      isAdmin: true,
    });

    await expect(service.findOne(42)).resolves.toEqual(
      expect.objectContaining({ id: 42, createdById: 20 }),
    );

    expect(query.andWhere).not.toHaveBeenCalled();
    expect(query.innerJoinAndSelect).not.toHaveBeenCalled();
  });

  it('allows an admin to update another admin assignment without changing its creator', async () => {
    const { service, assignmentRepository, requestContextService } =
      await setup();
    assignmentRepository.findOne
      .mockResolvedValueOnce({
        id: 55,
        createdById: 20,
        workerType: WorkerType.NODE_DEFAULT,
      })
      .mockResolvedValueOnce({
        id: 55,
        createdById: 20,
        title: 'Updated',
        boilerplateContent: '',
      });

    await expect(
      service.update(55, { title: 'Updated' } as any),
    ).resolves.toEqual(
      expect.objectContaining({ id: 55, createdById: 20, title: 'Updated' }),
    );

    expect(assignmentRepository.update).toHaveBeenCalledWith(55, {
      title: 'Updated',
    });
    expect(assignmentRepository.update).not.toHaveBeenCalledWith(
      55,
      expect.objectContaining({ createdById: expect.anything() }),
    );
    expect(requestContextService.getUser).not.toHaveBeenCalled();
  });

  it('updates the alert policy and increments its agreement version', async () => {
    const { service, assignmentRepository, assignmentAlertService } =
      await setup();
    assignmentRepository.findOne
      .mockResolvedValueOnce({
        id: 55,
        workerType: WorkerType.NODE_DEFAULT,
        alertPolicyVersion: 3,
      })
      .mockResolvedValueOnce({
        id: 55,
        suspensionAlertLimit: 2,
        typingCharactersPerSecondLimit: 35,
        alertPolicyVersion: 4,
      });

    await service.update(55, {
      alertPolicy: {
        suspensionAlertLimit: 2,
        typingCharactersPerSecondLimit: 35,
        punitiveTypes: [AssignmentAlertType.DEVTOOLS],
      },
    } as any);

    expect(assignmentRepository.update).toHaveBeenCalledWith(55, {
      suspensionAlertLimit: 2,
      typingCharactersPerSecondLimit: 35,
      alertPolicyVersion: 4,
    });
    expect(assignmentAlertService.replaceRules).toHaveBeenCalledWith(55, [
      AssignmentAlertType.DEVTOOLS,
    ]);
  });

  it('allows an admin to delete another admin assignment', async () => {
    const {
      service,
      assignmentRepository,
      attemptRepository,
      dataSource,
      requestContextService,
    } = await setup();
    const manager = { delete: jest.fn().mockResolvedValue({ affected: 1 }) };
    assignmentRepository.findOne.mockResolvedValue({
      id: 55,
      createdById: 20,
    });
    attemptRepository.count.mockResolvedValue(0);
    dataSource.transaction.mockImplementation((callback) => callback(manager));

    await expect(service.remove(55)).resolves.toEqual({ affected: 1 });

    expect(manager.delete).toHaveBeenNthCalledWith(1, AssignmentTemplate, {
      assignmentId: 55,
    });
    expect(manager.delete).toHaveBeenNthCalledWith(2, AssignmentParam, {
      assignmentId: 55,
    });
    expect(manager.delete).toHaveBeenNthCalledWith(3, Assignment, { id: 55 });
    expect(requestContextService.getUser).not.toHaveBeenCalled();
  });

  describe('template weight normalisation', () => {
    it('create assigns equal weights when none are provided (3 templates)', async () => {
      const {
        service,
        classService,
        assignmentRepository,
        assignmentTemplateRepository,
        assignmentParamsRepository,
        templateRepository,
        requestContextService,
      } = await setup();

      classService.findOne.mockResolvedValue({ id: 12 });
      requestContextService.getUser.mockReturnValue({
        userId: 7,
        isAdmin: false,
      });
      assignmentRepository.save.mockResolvedValue({
        id: 10,
        boilerplateContent: '',
      });
      templateRepository.find.mockResolvedValue([
        { id: 1, workerType: WorkerType.NODE_DEFAULT },
        { id: 2, workerType: WorkerType.NODE_DEFAULT },
        { id: 3, workerType: WorkerType.NODE_DEFAULT },
      ]);
      assignmentTemplateRepository.save.mockResolvedValue([]);
      assignmentParamsRepository.save.mockResolvedValue([]);

      await service.create({
        classId: 12,
        title: 'T',
        description: 'D',
        maxAttempts: 1,
        workerType: WorkerType.NODE_DEFAULT,
        validationScript: undefined as any,
        templates: [
          { templateId: 1, params: [] },
          { templateId: 2, params: [] },
          { templateId: 3, params: [] },
        ],
      });

      expect(assignmentTemplateRepository.save).toHaveBeenCalledWith([
        { assignmentId: 10, templateId: 1, weight: 33.33 },
        { assignmentId: 10, templateId: 2, weight: 33.33 },
        { assignmentId: 10, templateId: 3, weight: 33.34 },
      ]);
    });

    it('create persists explicit weights from the payload', async () => {
      const {
        service,
        classService,
        assignmentRepository,
        assignmentTemplateRepository,
        assignmentParamsRepository,
        templateRepository,
        requestContextService,
      } = await setup();

      classService.findOne.mockResolvedValue({ id: 12 });
      requestContextService.getUser.mockReturnValue({
        userId: 7,
        isAdmin: false,
      });
      assignmentRepository.save.mockResolvedValue({
        id: 11,
        boilerplateContent: '',
      });
      templateRepository.find.mockResolvedValue([
        { id: 1, workerType: WorkerType.NODE_DEFAULT },
        { id: 2, workerType: WorkerType.NODE_DEFAULT },
      ]);
      assignmentTemplateRepository.save.mockResolvedValue([]);
      assignmentParamsRepository.save.mockResolvedValue([]);

      await service.create({
        classId: 12,
        title: 'T',
        description: 'D',
        maxAttempts: 1,
        workerType: WorkerType.NODE_DEFAULT,
        validationScript: undefined as any,
        templates: [
          { templateId: 1, params: [], weight: 70 },
          { templateId: 2, params: [], weight: 30 },
        ],
      });

      expect(assignmentTemplateRepository.save).toHaveBeenCalledWith([
        { assignmentId: 11, templateId: 1, weight: 70 },
        { assignmentId: 11, templateId: 2, weight: 30 },
      ]);
    });

    it('create throws 400 when explicit weights do not sum to 100', async () => {
      const {
        service,
        classService,
        assignmentRepository,
        templateRepository,
        requestContextService,
      } = await setup();

      classService.findOne.mockResolvedValue({ id: 12 });
      requestContextService.getUser.mockReturnValue({
        userId: 7,
        isAdmin: false,
      });
      assignmentRepository.save.mockResolvedValue({
        id: 12,
        boilerplateContent: '',
      });
      templateRepository.find.mockResolvedValue([
        { id: 1, workerType: WorkerType.NODE_DEFAULT },
        { id: 2, workerType: WorkerType.NODE_DEFAULT },
      ]);

      await expect(
        service.create({
          classId: 12,
          title: 'T',
          description: 'D',
          maxAttempts: 1,
          workerType: WorkerType.NODE_DEFAULT,
          validationScript: undefined as any,
          templates: [
            { templateId: 1, params: [], weight: 60 },
            { templateId: 2, params: [], weight: 30 },
          ],
        }),
      ).rejects.toThrow('must sum to 100%');
    });

    it('create throws 400 for negative weight', async () => {
      const {
        service,
        classService,
        assignmentRepository,
        templateRepository,
        requestContextService,
      } = await setup();

      classService.findOne.mockResolvedValue({ id: 12 });
      requestContextService.getUser.mockReturnValue({
        userId: 7,
        isAdmin: false,
      });
      assignmentRepository.save.mockResolvedValue({
        id: 13,
        boilerplateContent: '',
      });
      templateRepository.find.mockResolvedValue([
        { id: 1, workerType: WorkerType.NODE_DEFAULT },
      ]);

      await expect(
        service.create({
          classId: 12,
          title: 'T',
          description: 'D',
          maxAttempts: 1,
          workerType: WorkerType.NODE_DEFAULT,
          validationScript: undefined as any,
          templates: [{ templateId: 1, params: [], weight: -5 }],
        }),
      ).rejects.toThrow('must be between 0 and 100');
    });

    it('update persists normalised weights', async () => {
      const {
        service,
        assignmentRepository,
        assignmentTemplateRepository,
        assignmentParamsRepository,
        templateRepository,
        requestContextService,
      } = await setup();

      requestContextService.getUser.mockReturnValue({
        userId: 7,
        isAdmin: false,
      });
      assignmentRepository.findOne
        .mockResolvedValueOnce({
          id: 55,
          createdById: 7,
          workerType: WorkerType.NODE_DEFAULT,
        })
        .mockResolvedValueOnce({ id: 55 });
      templateRepository.find.mockResolvedValue([
        { id: 1, workerType: WorkerType.NODE_DEFAULT },
        { id: 2, workerType: WorkerType.NODE_DEFAULT },
        { id: 3, workerType: WorkerType.NODE_DEFAULT },
      ]);
      assignmentTemplateRepository.delete.mockResolvedValue(undefined);
      assignmentParamsRepository.delete.mockResolvedValue(undefined);
      assignmentTemplateRepository.save.mockResolvedValue([]);
      assignmentParamsRepository.save.mockResolvedValue([]);

      await service.update(55, {
        classId: 1,
        title: 'U',
        description: 'D',
        maxAttempts: 1,
        workerType: WorkerType.NODE_DEFAULT,
        validationScript: undefined as any,
        templates: [
          { templateId: 1, params: [] },
          { templateId: 2, params: [] },
          { templateId: 3, params: [] },
        ],
      });

      expect(assignmentTemplateRepository.save).toHaveBeenCalledWith([
        { assignmentId: 55, templateId: 1, weight: 33.33 },
        { assignmentId: 55, templateId: 2, weight: 33.33 },
        { assignmentId: 55, templateId: 3, weight: 33.34 },
      ]);
    });
  });

  describe('assignment dates', () => {
    it('creates an assignment with parsed dates', async () => {
      const {
        service,
        classService,
        assignmentRepository,
        requestContextService,
      } = await setup();
      const startDate = new Date('2026-08-24T12:00:00.000Z');
      const dueDate = new Date('2026-08-25T12:00:00.000Z');

      classService.findOne.mockResolvedValue({ id: 1 });
      requestContextService.getUser.mockReturnValue({
        userId: 7,
        isAdmin: true,
      });
      assignmentRepository.save.mockImplementation(async (value) => ({
        id: 90,
        ...value,
      }));

      await service.create({
        classId: 1,
        title: 'Timed assignment',
        description: 'Description',
        maxAttempts: 3,
        workerType: WorkerType.NODE_DEFAULT,
        validationScript: undefined as any,
        templates: [],
        startDate: startDate.toISOString(),
        dueDate: dueDate.toISOString(),
      });

      expect(assignmentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ startDate, dueDate }),
      );
    });

    it('rejects a start date after the due date', async () => {
      const { service, assignmentRepository } = await setup();

      await expect(
        service.create({
          classId: 1,
          title: 'Invalid assignment',
          description: 'Description',
          maxAttempts: 3,
          workerType: WorkerType.NODE_DEFAULT,
          validationScript: undefined as any,
          templates: [],
          startDate: '2026-08-26T12:00:00.000Z',
          dueDate: '2026-08-25T12:00:00.000Z',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(assignmentRepository.save).not.toHaveBeenCalled();
    });

    it('validates partial updates against the persisted date', async () => {
      const { service, assignmentRepository } = await setup();
      assignmentRepository.findOne.mockResolvedValue({
        id: 55,
        workerType: WorkerType.NODE_DEFAULT,
        dueDate: new Date('2026-08-25T12:00:00.000Z'),
      });

      await expect(
        service.update(55, {
          startDate: '2026-08-26T12:00:00.000Z',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(assignmentRepository.update).not.toHaveBeenCalled();
    });

    it('clears a date when null is supplied', async () => {
      const { service, assignmentRepository } = await setup();
      assignmentRepository.findOne
        .mockResolvedValueOnce({
          id: 55,
          workerType: WorkerType.NODE_DEFAULT,
          startDate: new Date('2026-08-24T12:00:00.000Z'),
          dueDate: new Date('2026-08-25T12:00:00.000Z'),
        })
        .mockResolvedValueOnce({
          id: 55,
          startDate: null,
          dueDate: new Date('2026-08-25T12:00:00.000Z'),
          boilerplateContent: '',
        });

      await service.update(55, { startDate: null });

      expect(assignmentRepository.update).toHaveBeenCalledWith(55, {
        startDate: null,
      });
    });

    it('blocks submission when either the task or exam deadline passed', async () => {
      const { service, assignmentRepository, requestContextService } =
        await setup();
      const query = {
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          assignmentDueDate: '2099-01-01T00:00:00.000Z',
          examDueDate: '2020-01-01T00:00:00.000Z',
        }),
      };
      assignmentRepository.createQueryBuilder.mockReturnValue(query);
      requestContextService.getUser.mockReturnValue({
        userId: 10,
        isAdmin: false,
      });

      await expect(service.assertSubmissionOpen(42)).rejects.toBeInstanceOf(
        UnprocessableEntityException,
      );
    });
  });
});
