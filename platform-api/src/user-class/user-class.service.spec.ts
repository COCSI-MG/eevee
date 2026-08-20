import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserClassService } from './user-class.service';
import { UserClass } from './entities/user-class.entity';

describe('UserClassService', () => {
  let service: UserClassService;
  let userClassRepository: {
    upsert: jest.Mock;
    findOne: jest.Mock;
    delete: jest.Mock;
    find: jest.Mock;
  };

  beforeEach(async () => {
    userClassRepository = {
      upsert: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserClassService,
        {
          provide: getRepositoryToken(UserClass),
          useValue: userClassRepository,
        },
      ],
    }).compile();

    service = module.get<UserClassService>(UserClassService);
  });

  it('creates many user-class relations with the composite conflict target', async () => {
    const requests = [
      { userId: 1, classId: 10 },
      { userId: 2, classId: 10 },
    ];
    const upsertResult = { identifiers: [{ id: 1 }, { id: 2 }] };
    userClassRepository.upsert.mockResolvedValue(upsertResult as any);

    const result = await service.createMany(requests as any);

    expect(userClassRepository.upsert).toHaveBeenCalledWith(
      [
        { userId: 1, classId: 10 },
        { userId: 2, classId: 10 },
      ],
      expect.objectContaining({
        conflictPaths: ['userId', 'classId'],
        skipUpdateIfNoValuesChanged: true,
        upsertType: 'on-conflict-do-update',
      }),
    );
    expect(result).toBe(upsertResult);
  });

  it('finds a relation by userId and classId with relations loaded', async () => {
    userClassRepository.findOne.mockResolvedValue({
      id: 5,
      userId: 1,
      classId: 10,
    } as unknown as UserClass);

    await service.findOneByKeys(1, 10);

    expect(userClassRepository.findOne).toHaveBeenCalledWith({
      where: { userId: 1, classId: 10 },
      relations: ['class', 'user'],
    });
  });

  it('removes a relation by composite keys', async () => {
    userClassRepository.delete.mockResolvedValue({ affected: 1 } as any);

    await service.removeByKeys(3, 8);

    expect(userClassRepository.delete).toHaveBeenCalledWith({
      userId: 3,
      classId: 8,
    });
  });

  it('deletes all relations for a class id', async () => {
    userClassRepository.delete.mockResolvedValue({ affected: 4 } as any);

    await service.deleteByClassId(99);

    expect(userClassRepository.delete).toHaveBeenCalledWith({ classId: 99 });
  });
});
