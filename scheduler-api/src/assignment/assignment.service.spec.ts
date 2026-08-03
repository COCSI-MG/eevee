import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
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
    } = await setup();

    classService.findOne.mockResolvedValue({ id: 12 });
    requestContextService.getUser.mockReturnValue({
      userId: 7,
      isAdmin: false,
    });
    assignmentRepository.save.mockResolvedValue({
      id: 99,
      boilerplateContent: 'console.log("hi");',
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
      workerType: WorkerType.NODE_DEFAULT,
      validationScript: undefined as any,
      boilerplateContent: 'console.log("hi");',
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
        workerType: WorkerType.NODE_DEFAULT,
        boilerplateContent: 'console.log("hi");',
        createdById: 7,
      }),
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
      expect(qb.andWhere).toHaveBeenCalledWith('examAssignment.id IS NULL');
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1,
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

    it('applies the exam filter together with the admin createdById branch', async () => {
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

      expect(qb.andWhere).toHaveBeenCalledWith('examAssignment.id IS NULL');
      const createdByCall = qb.andWhere.mock.calls.find(
        (c) => c[0] instanceof Brackets,
      );
      expect(createdByCall).toBeDefined();
    });
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
      requestContextService.getUser.mockReturnValue({ userId: 7, isAdmin: false });
      assignmentRepository.save.mockResolvedValue({ id: 10, boilerplateContent: '' });
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
      requestContextService.getUser.mockReturnValue({ userId: 7, isAdmin: false });
      assignmentRepository.save.mockResolvedValue({ id: 11, boilerplateContent: '' });
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
      requestContextService.getUser.mockReturnValue({ userId: 7, isAdmin: false });
      assignmentRepository.save.mockResolvedValue({ id: 12, boilerplateContent: '' });
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
      requestContextService.getUser.mockReturnValue({ userId: 7, isAdmin: false });
      assignmentRepository.save.mockResolvedValue({ id: 13, boilerplateContent: '' });
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

      requestContextService.getUser.mockReturnValue({ userId: 7, isAdmin: false });
      assignmentRepository.findOne
        .mockResolvedValueOnce({ id: 55, createdById: 7, workerType: WorkerType.NODE_DEFAULT })
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
});
