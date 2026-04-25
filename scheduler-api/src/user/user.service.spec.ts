import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { HashUtils } from 'src/utils/hash.utils';

describe('UserService', () => {
  let service: UserService;
  let userRepository: {
    upsert: jest.Mock;
    findOne: jest.Mock;
    delete: jest.Mock;
    createQueryBuilder: jest.Mock;
  };

  beforeEach(async () => {
    userRepository = {
      upsert: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('creates or replaces a user with hashed password and email conflict upsert', async () => {
    const dto = {
      email: 'teacher@example.com',
      name: 'Teacher',
      password: 'plain-password',
      isAdmin: false,
    };

    jest.spyOn(HashUtils, 'hashPassword').mockReturnValue('hashed-password');
    userRepository.upsert.mockResolvedValue({
      identifiers: [{ id: 10 }],
    } as any);
    userRepository.findOne.mockResolvedValue({
      id: 10,
      email: dto.email,
      name: dto.name,
      isAdmin: dto.isAdmin,
      userClasses: [],
    } as unknown as User);

    const result = await service.createOrReplace(dto as any);

    expect(HashUtils.hashPassword).toHaveBeenCalledWith(dto.password);
    expect(userRepository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        email: dto.email,
        name: dto.name,
        password: dto.password,
        isAdmin: dto.isAdmin,
        passwordHash: 'hashed-password',
      }),
      expect.objectContaining({
        conflictPaths: ['email'],
        skipUpdateIfNoValuesChanged: true,
        upsertType: 'on-conflict-do-update',
      }),
    );
    expect(userRepository.findOne).toHaveBeenCalledWith({
      where: { id: 10 },
    });
    expect(result).toEqual({
      id: 10,
      email: dto.email,
      name: dto.name,
      userClasses: [],
    });
  });

  it('uses the id returned by upsert to load the saved user', async () => {
    jest.spyOn(HashUtils, 'hashPassword').mockReturnValue('hashed-password');
    userRepository.upsert.mockResolvedValue({
      identifiers: [{ id: 42 }],
    } as any);
    userRepository.findOne.mockResolvedValue({
      id: 42,
      email: 'saved@example.com',
      name: 'Saved User',
      isAdmin: false,
      userClasses: [],
    } as unknown as User);

    await service.createOrReplace({
      email: 'saved@example.com',
      name: 'Saved User',
      password: 'secret',
      isAdmin: false,
    } as any);

    expect(userRepository.findOne).toHaveBeenCalledWith({
      where: { id: 42 },
    });
  });

  it('throws when removing a missing user', async () => {
    userRepository.findOne.mockResolvedValue(null);

    await expect(service.remove(1)).rejects.toThrow('User not found');
    expect(userRepository.delete).not.toHaveBeenCalled();
  });

  it('throws when removing an admin user', async () => {
    userRepository.findOne.mockResolvedValue({
      id: 1,
      isAdmin: true,
    } as unknown as User);

    await expect(service.remove(1)).rejects.toThrow(
      'Cannot delete admin user',
    );
    expect(userRepository.delete).not.toHaveBeenCalled();
  });

  it('deletes a removable user', async () => {
    userRepository.findOne.mockResolvedValue({
      id: 7,
      isAdmin: false,
    } as unknown as User);
    userRepository.delete.mockResolvedValue({ affected: 1 } as any);

    await service.remove(7);

    expect(userRepository.delete).toHaveBeenCalledWith({ id: 7 });
  });

  const makeQueryBuilder = () => {
    const qb: Record<string, jest.Mock> = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
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

  describe('findAllPaginated', () => {
    it('returns paginated users with default page size and search filter', async () => {
      const qb = makeQueryBuilder();
      qb.getManyAndCount.mockResolvedValue([
        [{ id: 1, name: 'Alice', email: 'a@x.com', isAdmin: false, userClasses: [] }],
        23,
      ]);
      userRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAllPaginated({ page: 2, pageSize: 10, search: 'ali' });

      expect(qb.skip).toHaveBeenCalledWith(10);
      expect(qb.take).toHaveBeenCalledWith(10);
      expect(qb.andWhere).toHaveBeenCalled(); // brackets call
      expect(result).toEqual({
        data: [{ id: 1, name: 'Alice', email: 'a@x.com', isAdmin: false, userClasses: [] }],
        meta: { total: 23, page: 2, pageSize: 10, totalPages: 3 },
      });
    });

    it('falls back to page=1 pageSize=10 when no params provided', async () => {
      const qb = makeQueryBuilder();
      qb.getManyAndCount.mockResolvedValue([[], 0]);
      userRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAllPaginated({});

      expect(qb.skip).toHaveBeenCalledWith(0);
      expect(qb.take).toHaveBeenCalledWith(10);
      expect(result.meta).toEqual({ total: 0, page: 1, pageSize: 10, totalPages: 1 });
    });
  });
});
