import { ForbiddenException, UnprocessableEntityException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ClassService } from './class.service';
import { Class } from './entities/class.entity';
import { UserClassService } from 'src/user-class/user-class.service';
import { RequestContextService } from 'src/request-context/request-context.service';
import { CreateOrReplaceClassDto } from './dto/request/create-or-replace-class.dto';

describe('ClassService', () => {
  let service: ClassService;
  let classRepository: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    find: jest.Mock;
    delete: jest.Mock;
  };
  let userClassService: {
    createMany: jest.Mock;
    deleteByClassId: jest.Mock;
  };
  let requestContextService: {
    getUser: jest.Mock;
  };

  beforeEach(async () => {
    classRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      find: jest.fn(),
      delete: jest.fn(),
    };
    userClassService = {
      createMany: jest.fn(),
      deleteByClassId: jest.fn(),
    };
    requestContextService = {
      getUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassService,
        {
          provide: getRepositoryToken(Class),
          useValue: classRepository,
        },
        {
          provide: UserClassService,
          useValue: userClassService,
        },
        {
          provide: RequestContextService,
          useValue: requestContextService,
        },
      ],
    }).compile();

    service = module.get<ClassService>(ClassService);
  });

  it('creates a new class and students when provided', async () => {
    classRepository.create.mockReturnValue({
      id: 10,
      name: 'Algorithms',
      description: 'Intro class',
    });
    classRepository.save.mockResolvedValue({
      id: 10,
      name: 'Algorithms',
      description: 'Intro class',
    });

    const dto: CreateOrReplaceClassDto = {
      name: 'Algorithms',
      description: 'Intro class',
      students: [1, 2],
    };

    await expect(service.createOrReplace(dto)).resolves.toEqual({
      id: 10,
      name: 'Algorithms',
      description: 'Intro class',
      users: [],
    });

    expect(classRepository.create).toHaveBeenCalledWith({
      name: 'Algorithms',
      description: 'Intro class',
    });
    expect(classRepository.save).toHaveBeenCalledWith({
      id: 10,
      name: 'Algorithms',
      description: 'Intro class',
    });
    expect(userClassService.createMany).toHaveBeenCalledWith([
      { userId: 1, classId: 10 },
      { userId: 2, classId: 10 },
    ]);
  });

  it('updates an existing class and clears previous links', async () => {
    classRepository.findOne.mockResolvedValue({
      id: 5,
      name: 'Old name',
      description: 'Old description',
    });
    classRepository.update.mockResolvedValue({ affected: 1 });
    userClassService.deleteByClassId.mockResolvedValue({ affected: 2 });

    const dto: CreateOrReplaceClassDto = {
      id: 5,
      name: 'New name',
      description: 'New description',
      students: [9],
    };

    await expect(service.createOrReplace(dto)).resolves.toEqual({
      id: 5,
      name: 'New name',
      description: 'New description',
      users: [],
    });

    expect(classRepository.findOne).toHaveBeenCalledWith({
      where: { id: 5 },
    });
    expect(classRepository.update).toHaveBeenCalledWith(5, {
      name: 'New name',
      description: 'New description',
    });
    expect(userClassService.deleteByClassId).toHaveBeenCalledWith(5);
    expect(userClassService.createMany).toHaveBeenCalledWith([
      { userId: 9, classId: 5 },
    ]);
  });

  it('throws when trying to replace a class that does not exist', async () => {
    classRepository.findOne.mockResolvedValue(null);

    await expect(
      service.createOrReplace({
        id: 404,
        name: 'Missing',
        description: 'Missing',
        students: [1],
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    expect(classRepository.update).not.toHaveBeenCalled();
    expect(userClassService.deleteByClassId).not.toHaveBeenCalled();
  });

  it('blocks access to another user without admin rights', async () => {
    requestContextService.getUser.mockReturnValue({
      userId: 2,
      isAdmin: false,
    });

    await expect(service.findAllByUser(1)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('queries classes correctly when access is allowed', async () => {
    requestContextService.getUser.mockReturnValue({
      userId: 7,
      isAdmin: false,
    });
    classRepository.find.mockResolvedValue([
      {
        id: 7,
        name: 'Algorithms',
        description: 'Intro class',
      },
    ]);

    await expect(service.findAllByUser(7)).resolves.toEqual([
      {
        id: 7,
        name: 'Algorithms',
        description: 'Intro class',
      },
    ]);

    expect(classRepository.find).toHaveBeenCalledWith({
      relations: [
        'userClasses',
        'userClasses.user',
        'userClasses.class',
        'assignments',
      ],
      where: {
        userClasses: {
          user: { id: 7 },
        },
      },
    });
  });
});
