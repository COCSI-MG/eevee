import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { HashUtils } from 'src/utils/hash.utils';

describe('UserService', () => {
  let service: UserService;
  let userRepository: {
    save: jest.Mock;
    update: jest.Mock;
    findOne: jest.Mock;
    softDelete: jest.Mock;
    createQueryBuilder: jest.Mock;
  };

  beforeEach(async () => {
    userRepository = {
      save: jest.fn(),
      update: jest.fn(),
      findOne: jest.fn(),
      softDelete: jest.fn(),
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

  it('creates a user with a hashed password', async () => {
    const dto = {
      email: 'teacher@example.com',
      name: 'Teacher',
      password: 'plain-password',
      isAdmin: false,
    };

    jest.spyOn(HashUtils, 'hashPassword').mockReturnValue('hashed-password');
    userRepository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
      id: 10,
      email: dto.email,
      name: dto.name,
      isAdmin: dto.isAdmin,
      userClasses: [],
      } as unknown as User);
    userRepository.save.mockResolvedValue({ id: 10 } as User);

    const result = await service.createOrReplace(dto as any);

    expect(HashUtils.hashPassword).toHaveBeenCalledWith(dto.password);
    expect(userRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        email: dto.email,
        name: dto.name,
        isAdmin: dto.isAdmin,
        passwordHash: 'hashed-password',
      }),
    );
    expect(userRepository.save.mock.calls[0][0]).not.toHaveProperty(
      'password',
    );
    expect(userRepository.findOne).toHaveBeenLastCalledWith({
      where: { id: 10 },
    });
    expect(result).toEqual({
      id: 10,
      email: dto.email,
      name: dto.name,
      userClasses: [],
    });
  });

  it('replaces an active user but does not revive a soft-deleted row', async () => {
    jest.spyOn(HashUtils, 'hashPassword').mockReturnValue('hashed-password');
    userRepository.findOne
      .mockResolvedValueOnce({ id: 42, email: 'saved@example.com' } as User)
      .mockResolvedValueOnce({
      id: 42,
      email: 'saved@example.com',
      name: 'Saved User',
      isAdmin: false,
      userClasses: [],
      } as unknown as User);
    userRepository.save.mockResolvedValue({ id: 42 } as User);

    await service.createOrReplace({
      email: 'saved@example.com',
      name: 'Saved User',
      password: 'secret',
      isAdmin: false,
    } as any);

    expect(userRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 42, email: 'saved@example.com' }),
    );
    expect(userRepository.findOne).toHaveBeenLastCalledWith({
      where: { id: 42 },
    });
  });

  it('updates an admin flag without replacing the current password', async () => {
    const existingUser = {
      id: 7,
      email: 'student@example.com',
      name: 'Student',
      isAdmin: false,
      passwordHash: 'current-hash',
    } as User;
    const updatedUser = { ...existingUser, isAdmin: true };

    userRepository.findOne
      .mockResolvedValueOnce(existingUser)
      .mockResolvedValueOnce(updatedUser);
    userRepository.update.mockResolvedValue({ affected: 1 } as any);
    const hashPassword = jest.spyOn(HashUtils, 'hashPassword');

    const result = await service.update(7, { isAdmin: true });

    expect(hashPassword).not.toHaveBeenCalled();
    expect(userRepository.update).toHaveBeenCalledWith(7, {
      isAdmin: true,
    });
    expect(userRepository.update.mock.calls[0][1]).not.toHaveProperty(
      'passwordHash',
    );
    expect(result).toEqual({
      id: 7,
      email: 'student@example.com',
      name: 'Student',
      userClasses: undefined,
    });
  });

  it('throws when updating a missing user', async () => {
    userRepository.findOne.mockResolvedValue(null);

    await expect(service.update(99, { isAdmin: true })).rejects.toThrow(
      'User not found',
    );
    expect(userRepository.update).not.toHaveBeenCalled();
  });

  it('throws when removing a missing user', async () => {
    userRepository.findOne.mockResolvedValue(null);

    await expect(service.remove(1)).rejects.toThrow('User not found');
    expect(userRepository.softDelete).not.toHaveBeenCalled();
  });

  it('throws when removing an admin user', async () => {
    userRepository.findOne.mockResolvedValue({
      id: 1,
      isAdmin: true,
    } as unknown as User);

    await expect(service.remove(1)).rejects.toThrow('Cannot delete admin user');
    expect(userRepository.softDelete).not.toHaveBeenCalled();
  });

  it('deletes a removable user', async () => {
    userRepository.findOne.mockResolvedValue({
      id: 7,
      isAdmin: false,
    } as unknown as User);
    userRepository.softDelete.mockResolvedValue({ affected: 1 } as any);

    await service.remove(7);

    expect(userRepository.softDelete).toHaveBeenCalledWith({ id: 7 });
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
        [
          {
            id: 1,
            name: 'Alice',
            email: 'a@x.com',
            isAdmin: false,
            userClasses: [],
          },
        ],
        23,
      ]);
      userRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAllPaginated({
        page: 2,
        pageSize: 10,
        search: 'ali',
      });

      expect(qb.skip).toHaveBeenCalledWith(10);
      expect(qb.take).toHaveBeenCalledWith(10);
      expect(qb.andWhere).toHaveBeenCalled(); // brackets call
      expect(result).toEqual({
        data: [
          {
            id: 1,
            name: 'Alice',
            email: 'a@x.com',
            isAdmin: false,
            userClasses: [],
          },
        ],
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
      expect(result.meta).toEqual({
        total: 0,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      });
    });

    it('skips the search clause when no search is provided', async () => {
      const qb = makeQueryBuilder();
      qb.getManyAndCount.mockResolvedValue([[], 0]);
      userRepository.createQueryBuilder.mockReturnValue(qb);

      await service.findAllPaginated({ page: 1, pageSize: 10 });

      expect(qb.andWhere).not.toHaveBeenCalled();
    });
  });
});
