import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import {
  THROTTLER_LIMIT,
  THROTTLER_SKIP,
  THROTTLER_TTL,
} from '@nestjs/throttler/dist/throttler.constants';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const authService = {
    validateUserAndLogin: jest.fn(),
    registerUser: jest.fn(),
    buildSession: jest.fn(),
  };

  const configService = {
    get: jest.fn().mockReturnValue('local'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('sets the auth cookie and returns the session on login', async () => {
    authService.validateUserAndLogin.mockResolvedValue({
      token: 'signed-token',
      session: {
        userId: 12,
        email: 'admin@example.com',
        isAdmin: true,
      },
    });
    const response = {
      cookie: jest.fn(),
    } as any;

    await expect(
      controller.create(
        {
          email: 'admin@example.com',
          password: 'secret',
        } as never,
        response,
      ),
    ).resolves.toEqual({
      userId: 12,
      email: 'admin@example.com',
      isAdmin: true,
    });

    expect(response.cookie).toHaveBeenCalledWith(
      'eevee_auth',
      'signed-token',
      expect.objectContaining({
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        secure: false,
        maxAge: 60 * 60 * 1000,
      }),
    );
  });

  it('sets the auth cookie and returns the session on register', async () => {
    authService.registerUser.mockResolvedValue({
      token: 'signed-token',
      session: {
        userId: 33,
        email: 'student@example.com',
        isAdmin: false,
      },
    });
    const response = {
      cookie: jest.fn(),
    } as any;

    await expect(
      controller.register(
        {
          email: 'student@example.com',
          password: 'secret',
          name: 'Student',
        } as never,
        response,
      ),
    ).resolves.toEqual({
      userId: 33,
      email: 'student@example.com',
      isAdmin: false,
    });

    expect(response.cookie).toHaveBeenCalledWith(
      'eevee_auth',
      'signed-token',
      expect.objectContaining({
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        secure: false,
        maxAge: 60 * 60 * 1000,
      }),
    );
  });

  it('clears the auth cookie on logout', () => {
    const response = {
      clearCookie: jest.fn(),
    } as any;

    controller.logout(response);

    expect(response.clearCookie).toHaveBeenCalledWith(
      'eevee_auth',
      expect.objectContaining({
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        secure: false,
        maxAge: 60 * 60 * 1000,
      }),
    );
  });

  it('returns the current session on me', () => {
    const request = {
      user: {
        userId: 12,
        email: 'admin@example.com',
        isAdmin: true,
      },
    } as any;

    expect(controller.getMe(request)).toEqual(request.user);
    expect(authService.buildSession).not.toHaveBeenCalled();
  });

  it('applies a strong throttle to login and register', () => {
    expect(
      Reflect.getMetadata(THROTTLER_LIMIT + 'default', AuthController.prototype.create),
    ).toBe(5);
    expect(
      Reflect.getMetadata(THROTTLER_TTL + 'default', AuthController.prototype.create),
    ).toBe(60000);
    expect(
      Reflect.getMetadata(THROTTLER_LIMIT + 'default', AuthController.prototype.register),
    ).toBe(5);
    expect(
      Reflect.getMetadata(THROTTLER_TTL + 'default', AuthController.prototype.register),
    ).toBe(60000);
  });

  it('skips throttling for me and logout', () => {
    expect(
      Reflect.getMetadata(THROTTLER_SKIP + 'default', AuthController.prototype.getMe),
    ).toBe(true);
    expect(
      Reflect.getMetadata(THROTTLER_SKIP + 'default', AuthController.prototype.logout),
    ).toBe(true);
  });
});
