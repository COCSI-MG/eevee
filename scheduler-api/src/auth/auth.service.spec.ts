import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { HashUtils } from 'src/utils/hash.utils';
import { UserService } from 'src/user/user.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  const userService = {
    findByEmail: jest.fn(),
    createOrReplace: jest.fn(),
  };

  const jwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: userService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('returns a signed session for valid credentials', async () => {
    userService.findByEmail.mockResolvedValue({
      id: 12,
      email: 'admin@example.com',
      isAdmin: true,
      passwordHash: 'hashed-password',
    });
    jest.spyOn(HashUtils, 'comparePassword').mockReturnValue(true);
    jwtService.sign.mockReturnValue('signed-token');

    await expect(
      service.validateUserAndLogin({
        email: 'admin@example.com',
        password: 'secret',
      }),
    ).resolves.toEqual({
      token: 'signed-token',
      session: {
        userId: 12,
        email: 'admin@example.com',
        isAdmin: true,
      },
    });

    expect(jwtService.sign).toHaveBeenCalledWith({
      userId: 12,
      email: 'admin@example.com',
      isAdmin: true,
    });
  });

  it('returns undefined for invalid credentials', async () => {
    userService.findByEmail.mockResolvedValue({
      id: 12,
      email: 'admin@example.com',
      isAdmin: true,
      passwordHash: 'hashed-password',
    });
    jest.spyOn(HashUtils, 'comparePassword').mockReturnValue(false);

    await expect(
      service.validateUserAndLogin({
        email: 'admin@example.com',
        password: 'wrong-password',
      }),
    ).resolves.toBeUndefined();

    expect(jwtService.sign).not.toHaveBeenCalled();
  });

  it('returns a signed session for a new registration', async () => {
    userService.findByEmail.mockResolvedValue(undefined);
    userService.createOrReplace.mockResolvedValue({
      id: 33,
      email: 'student@example.com',
      name: 'Student',
    });
    jwtService.sign.mockReturnValue('signed-token');

    await expect(
      service.registerUser({
        email: 'student@example.com',
        password: 'secret',
        name: 'Student',
      }),
    ).resolves.toEqual({
      token: 'signed-token',
      session: {
        userId: 33,
        email: 'student@example.com',
        isAdmin: false,
      },
    });

    expect(userService.createOrReplace).toHaveBeenCalledWith({
      email: 'student@example.com',
      password: 'secret',
      name: 'Student',
      isAdmin: false,
    });
  });

  it('returns undefined when registering an existing user', async () => {
    userService.findByEmail.mockResolvedValue({
      id: 12,
      email: 'admin@example.com',
      isAdmin: true,
      passwordHash: 'hashed-password',
    });

    await expect(
      service.registerUser({
        email: 'admin@example.com',
        password: 'secret',
        name: 'Admin',
      }),
    ).resolves.toBeUndefined();

    expect(userService.createOrReplace).not.toHaveBeenCalled();
  });
});
