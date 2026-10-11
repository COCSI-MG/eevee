import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { TemplateService } from './template.service';
import { Template } from './entities/template.entity';
import { TemplateParam } from 'src/template/entities/template-param.entity';
import { AssignmentTemplate } from 'src/assignment/entities/assignment-template.entity';
import { ClassAccessService } from 'src/auth/class-access.service';
import { TemplateParamType } from 'src/template/enums/template-param-type.enum';
import { UserRole } from 'src/user/user-role';
import { WorkerType } from 'src/worker/enum/worker-type.enum';

describe('TemplateService', () => {
  let service: TemplateService;

  const createRepositoryMock = () => ({
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  });

  const setup = async () => {
    const templateRepository = createRepositoryMock();
    const templateParamsRepository = createRepositoryMock();
    const assignmentTemplateRepository = createRepositoryMock();
    const classAccess = {
      assertTeacherAssignment: jest.fn().mockResolvedValue(undefined),
      assertClassAccess: jest.fn().mockResolvedValue(undefined),
      assertTemplateAccess: jest.fn( async (id: number) => templateRepository.findOne({ where: { id } }) ),
      isAdmin: jest.fn().mockReturnValue(true),
      user: jest.fn().mockReturnValue({ userId: 1, role: UserRole.ADMIN }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplateService,
        {
          provide: getRepositoryToken(Template),
          useValue: templateRepository,
        },
        {
          provide: getRepositoryToken(TemplateParam),
          useValue: templateParamsRepository,
        },
        {
          provide: getRepositoryToken(AssignmentTemplate),
          useValue: assignmentTemplateRepository,
        },
        {
          provide: ClassAccessService,
          useValue: classAccess
        }
      ],
    }).compile();

    return {
      service: module.get<TemplateService>(TemplateService),
      templateRepository,
      templateParamsRepository,
      assignmentTemplateRepository,
      classAccess
    };
  };

  beforeEach(async () => {
    ({ service } = await setup());
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create persists dependencies as empty array and defaults typed params to STRING', async () => {
    const {
      service,
      templateRepository,
      templateParamsRepository,
      classAccess
    } = await setup();

    templateRepository.save.mockResolvedValue({ id: 8 });
    templateRepository.findOne.mockResolvedValue({
      id: 8,
      title: 'Template',
      description: 'Desc',
      filePath: null,
      content: 'content',
      workerType: WorkerType.NODE_DEFAULT,
      dependencies: [],
      classId: 3
    });

    const result = await service.create({
      title: 'Template',
      description: 'Desc',
      content: 'content',
      workerType: WorkerType.NODE_DEFAULT,
      params: ['inputValue'],
      classId: 3
    });

    expect(templateRepository.save).toHaveBeenCalledWith({
      title: 'Template',
      description: 'Desc',
      filePath: null,
      content: 'content',
      workerType: WorkerType.NODE_DEFAULT,
      dependencies: [],
      classId: 3
    });
    expect(classAccess.assertTeacherAssignment).toHaveBeenCalledWith(3);
    expect(templateParamsRepository.save).toHaveBeenCalledWith([
      {
        name: 'inputValue',
        templateId: 8,
        type: TemplateParamType.STRING,
      },
    ]);
    expect(result).toMatchObject({
      id: 8,
      title: 'Template',
      dependencies: [],
    });
  });

  it('update throws when template does not exist', async () => {
    const { service, templateRepository } = await setup();

    templateRepository.findOne.mockResolvedValue(null);

    await expect(
      service.update(10, {
        title: 'New title',
        params: undefined as any,
        content: undefined as any,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(templateRepository.update).not.toHaveBeenCalled();
  });

  it('update blocks removing params when template is already associated to an assignment', async () => {
    const {
      service,
      templateRepository,
      templateParamsRepository,
      assignmentTemplateRepository,
    } = await setup();

    templateRepository.findOne.mockResolvedValue({
      id: 10,
      title: 'Template',
      description: 'Desc',
      filePath: null,
      content: 'content',
      workerType: WorkerType.NODE_DEFAULT,
      dependencies: [],
    });
    templateParamsRepository.find.mockResolvedValue([
      { id: 1, name: 'keep', templateId: 10, type: TemplateParamType.STRING },
      { id: 2, name: 'remove', templateId: 10, type: TemplateParamType.STRING },
    ]);
    assignmentTemplateRepository.findOne.mockResolvedValue({
      id: 99,
      templateId: 10,
    });

    await expect(
      service.update(10, {
        params: ['keep'],
        title: 'Template',
        content: undefined as any,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(templateRepository.update).toHaveBeenCalledWith(10, {
      title: 'Template',
    });
    expect(templateParamsRepository.delete).not.toHaveBeenCalled();
  });

  it('update creates new params and updates the type of existing params', async () => {
    const { service, templateRepository, templateParamsRepository } =
      await setup();

    templateRepository.findOne.mockResolvedValue({
      id: 10,
      title: 'Template',
      description: 'Desc',
      filePath: null,
      content: 'content',
      workerType: WorkerType.NODE_DEFAULT,
      dependencies: [],
    });
    templateParamsRepository.find.mockResolvedValue([
      {
        id: 1,
        name: 'existing',
        templateId: 10,
        type: TemplateParamType.STRING,
      },
    ]);
    templateRepository.update.mockResolvedValue({ affected: 1 });

    const result = await service.update(10, {
      title: 'Template updated',
      params: ['existing', 'newParam'],
      typedParams: [
        { name: 'existing', type: TemplateParamType.NUMBER },
        { name: 'newParam', type: TemplateParamType.BOOLEAN },
      ],
      content: undefined as any,
    });

    expect(templateRepository.update).toHaveBeenCalledWith(10, {
      title: 'Template updated',
    });
    expect(templateParamsRepository.save).toHaveBeenNthCalledWith(1, [
      {
        name: 'newParam',
        templateId: 10,
        type: TemplateParamType.BOOLEAN,
      },
    ]);
    expect(templateParamsRepository.save).toHaveBeenNthCalledWith(2, [
      {
        id: 1,
        type: TemplateParamType.NUMBER,
      },
    ]);
    expect(result).toMatchObject({
      id: 10,
      title: 'Template',
    });
  });

  it('remove throws when template is associated to an assignment', async () => {
    const { service, assignmentTemplateRepository, templateRepository } =
      await setup();

    assignmentTemplateRepository.findOne.mockResolvedValue({
      id: 99,
      templateId: 10,
    });

    await expect(service.remove(10)).rejects.toBeInstanceOf(ConflictException);

    expect(templateRepository.findOne).toHaveBeenCalledTimes(1);
    expect(templateRepository.delete).not.toHaveBeenCalled();
  });

  it('remove throws when template does not exist', async () => {
    const { service, assignmentTemplateRepository, templateRepository } =
      await setup();

    assignmentTemplateRepository.findOne.mockResolvedValue(null);
    templateRepository.findOne.mockResolvedValue(null);

    await expect(service.remove(10)).rejects.toBeInstanceOf(NotFoundException);

    expect(templateRepository.delete).not.toHaveBeenCalled();
  });

  describe('findAllPaginated', () => {
    const makeQueryBuilder = () => {
      const qb: Record<string, jest.Mock> = {
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

    it('filters by workerType and search and paginates', async () => {
      const { service, templateRepository } = await setup();
      const qb = makeQueryBuilder();
      qb.getManyAndCount.mockResolvedValue([
        [{ id: 5, title: 'Foo', description: 'Bar', workerType: 'worker-a' }],
        1,
      ]);
      templateRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAllPaginated({
        workerType: 'worker-a' as any,
        search: 'foo',
        page: 1,
        pageSize: 10,
      } as any);

      expect(qb.skip).toHaveBeenCalledWith(0);
      expect(qb.take).toHaveBeenCalledWith(10);
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });
});
