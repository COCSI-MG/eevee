import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { HashUtils } from 'src/utils/hash.utils';
import { UserService } from 'src/user/user.service';
import { AuthService } from './auth.service';
import { RefreshSessionService } from './refresh-session.service';

describe('AuthService', () => {
  let service: AuthService;

  const userService = {
    findByEmail: jest.fn(),
    createOrReplace: jest.fn(),
    findOne: jest.fn(),
  };

  const jwtService = {
    sign: jest.fn(),
    decode: jest.fn().mockReturnValue({ exp: 0 }),
  };

  const refreshSessionService = {
    create: jest.fn(),
    rotate: jest.fn(),
    revokeFamily: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: userService },
        { provide: JwtService, useValue: jwtService },
        { provide: RefreshSessionService, useValue: refreshSessionService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    refreshSessionService.create.mockResolvedValue({
      token: 'refresh-token',
      session: { userId: 12, familyId: 'family-1' },
    });
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
      accessToken: 'signed-token',
      refreshToken: 'refresh-token',
      session: {
        userId: 12,
        email: 'admin@example.com',
        isAdmin: true,
        expiresIn: 0,
      },
    });

    expect(jwtService.sign).toHaveBeenCalledWith({
      userId: 12,
      email: 'admin@example.com',
      isAdmin: true,
      familyId: 'family-1',
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
      accessToken: 'signed-token',
      refreshToken: 'refresh-token',
      session: {
        userId: 33,
        email: 'student@example.com',
        isAdmin: false,
        expiresIn: 0,
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
  describe('refreshSession', () => {
    const rotated = {
      status: 'rotated',
      token: 'novo-refresh',
      session: { userId: 12, familyId: 'family-1' },
    };

    it('reports a race without touching the user', async () => {
      refreshSessionService.rotate.mockResolvedValue({ status: 'raced' });

      await expect(service.refreshSession('token')).resolves.toEqual({
        status: 'raced',
      });
      expect(userService.findOne).not.toHaveBeenCalled();
    });

    it('denies when the rotation was refused', async () => {
      refreshSessionService.rotate.mockResolvedValue({ status: 'denied' });

      await expect(service.refreshSession('token')).resolves.toEqual({
        status: 'denied',
      });
    });

    it('denies and revokes the family when the user no longer exists', async () => {
      refreshSessionService.rotate.mockResolvedValue(rotated);
      userService.findOne.mockResolvedValue(null);

      await expect(service.refreshSession('token')).resolves.toEqual({
        status: 'denied',
      });
      expect(refreshSessionService.revokeFamily).toHaveBeenCalledWith(
        'family-1',
      );
    });

    it('signs a new access token carrying the family id', async () => {
      refreshSessionService.rotate.mockResolvedValue(rotated);
      userService.findOne.mockResolvedValue({
        id: 12,
        email: 'admin@example.com',
        isAdmin: true,
      });
      jwtService.sign.mockReturnValue('novo-access');

      await expect(service.refreshSession('token')).resolves.toEqual({
        status: 'refreshed',
        accessToken: 'novo-access',
        refreshToken: 'novo-refresh',
        session: {
          userId: 12,
          email: 'admin@example.com',
          isAdmin: true,
          expiresIn: 0,
        },
      });

      expect(jwtService.sign).toHaveBeenCalledWith({
        email: 'admin@example.com',
        userId: 12,
        isAdmin: true,
        familyId: 'family-1',
      });
    });

    it('uses current user data instead of stale session data', async () => {
      refreshSessionService.rotate.mockResolvedValue(rotated);
      userService.findOne.mockResolvedValue({
        id: 12,
        email: 'novo@example.com',
        isAdmin: false,
      });
      jwtService.sign.mockReturnValue('novo-access');

      const result = await service.refreshSession('token');

      expect(result).toMatchObject({
        session: { email: 'novo@example.com', isAdmin: false },
      });
    });
  });
  describe('buildSession', () => {
    it('reports the seconds left until the access token expires', () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00Z'));
      const exp = Math.floor(Date.now() / 1000) + 900;

      expect(
        service.buildSession({
          userId: 12,
          email: 'admin@example.com',
          isAdmin: true,
          exp,
        }),
      ).toEqual({
        userId: 12,
        email: 'admin@example.com',
        isAdmin: true,
        expiresIn: 900,
      });

      jest.useRealTimers();
    });

    it('reports zero for a token that carries no expiry', () => {
      expect(
        service.buildSession({
          userId: 12,
          email: 'admin@example.com',
          isAdmin: true,
        }).expiresIn,
      ).toBe(0);
    });

    it('never reports a negative window for an expired token', () => {
      expect(
        service.buildSession({
          userId: 12,
          email: 'admin@example.com',
          isAdmin: true,
          exp: Math.floor(Date.now() / 1000) - 60,
        }).expiresIn,
      ).toBe(0);
    });

    it('does not expose the session family', () => {
      const session = service.buildSession({
        userId: 12,
        email: 'admin@example.com',
        isAdmin: true,
        familyId: 'family-1',
        exp: Math.floor(Date.now() / 1000) + 60,
      });

      expect(session).not.toHaveProperty('familyId');
    });
  });
});
