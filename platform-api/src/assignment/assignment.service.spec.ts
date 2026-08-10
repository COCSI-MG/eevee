import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
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
      { assignmentId: 99, templateId: 1 },
      { assignmentId: 99, templateId: 2 },
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
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      });
    });
  });
});
