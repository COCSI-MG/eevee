import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import {
  THROTTLER_LIMIT,
  THROTTLER_SKIP,
  THROTTLER_TTL,
} from '@nestjs/throttler/dist/throttler.constants';
import { DEFAULT_AUTH_SESSION_TTL_SECONDS } from './auth-cookie.util';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordResetService } from './password-reset.service';

describe('AuthController', () => {
  let controller: AuthController;

  const authService = {
    refreshSession: jest.fn(),
    validateUserAndLogin: jest.fn(),
    registerUser: jest.fn(),
    buildSession: jest.fn(),
  };

  const passwordResetService = {
    requestReset: jest.fn(),
    resetPassword: jest.fn(),
  };

  const configService = {
    get: jest.fn().mockReturnValue('local'),
  };


  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: PasswordResetService, useValue: passwordResetService },
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
        maxAge: DEFAULT_AUTH_SESSION_TTL_SECONDS * 1000,
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
        maxAge: DEFAULT_AUTH_SESSION_TTL_SECONDS * 1000,
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
        maxAge: DEFAULT_AUTH_SESSION_TTL_SECONDS * 1000,
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

  it('forwards the email to the service on forgot-password', async () => {
    passwordResetService.requestReset.mockResolvedValue({
      message: 'Um email será enviado para o endereço fornecido',
    });

    const result = await controller.forgotPassword({
      email: 'user@example.com',
    } as never);

    expect(result).toEqual({
      message: 'Um email será enviado para o endereço fornecido',
    });
    expect(passwordResetService.requestReset).toHaveBeenCalledWith('user@example.com');
  });

  it('throws when passwords do not match on reset-password', async () => {
    await expect(
      controller.resetPassword({
        token: 'some-token',
        newPassword: 'abc12345',
        confirmPassword: 'different',
      } as never),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws when token is invalid or expired on reset-password', async () => {
    passwordResetService.resetPassword.mockResolvedValue({ success: false });

    await expect(
      controller.resetPassword({
        token: 'invalid-token',
        newPassword: 'novaSenha1',
        confirmPassword: 'novaSenha1',
      } as never),
    ).rejects.toThrow(BadRequestException);

    expect(passwordResetService.resetPassword).toHaveBeenCalledWith(
      'invalid-token',
      'novaSenha1',
    );
  });

  it('returns a success message when the password is reset', async () => {
    passwordResetService.resetPassword.mockResolvedValue({ success: true });

    const result = await controller.resetPassword({
      token: 'valid-token',
      newPassword: 'novaSenha1',
      confirmPassword: 'novaSenha1',
    } as never);

    expect(result).toEqual({ message: 'Senha alterada com sucesso' });
    expect(passwordResetService.resetPassword).toHaveBeenCalledWith(
      'valid-token',
      'novaSenha1',
    );
  });

  it('applies a strong throttle to login, register, forgot-password, and reset-password', () => {
    expect(
      Reflect.getMetadata(
        THROTTLER_LIMIT + 'default',
        AuthController.prototype.create,
      ),
    ).toBe(5);
    expect(
      Reflect.getMetadata(
        THROTTLER_TTL + 'default',
        AuthController.prototype.create,
      ),
    ).toBe(60000);
    expect(
      Reflect.getMetadata(
        THROTTLER_LIMIT + 'default',
        AuthController.prototype.register,
      ),
    ).toBe(5);
    expect(
      Reflect.getMetadata(
        THROTTLER_TTL + 'default',
        AuthController.prototype.register,
      ),
    ).toBe(60000);
    expect(
      Reflect.getMetadata(
        THROTTLER_LIMIT + 'default',
        AuthController.prototype.forgotPassword,
      ),
    ).toBe(3);
    expect(
      Reflect.getMetadata(
        THROTTLER_TTL + 'default',
        AuthController.prototype.forgotPassword,
      ),
    ).toBe(60000);
    expect(
      Reflect.getMetadata(
        THROTTLER_LIMIT + 'default',
        AuthController.prototype.resetPassword,
      ),
    ).toBe(5);
    expect(
      Reflect.getMetadata(
        THROTTLER_TTL + 'default',
        AuthController.prototype.resetPassword,
      ),
    ).toBe(60000);
  });

  it('skips throttling for me and logout', () => {
    expect(
      Reflect.getMetadata(
        THROTTLER_SKIP + 'default',
        AuthController.prototype.getMe,
      ),
    ).toBe(true);
    expect(
      Reflect.getMetadata(
        THROTTLER_SKIP + 'default',
        AuthController.prototype.logout,
      ),
    ).toBe(true);
  });
  describe('refresh', () => {
    const buildResponse = () =>
      ({ cookie: jest.fn(), clearCookie: jest.fn() }) as any;

    it('rejects and clears both cookies when there is no refresh cookie', async () => {
      const response = buildResponse();

      await expect(
        controller.refresh({ headers: {} } as any, response),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(response.clearCookie).toHaveBeenCalledWith(
        'eevee_auth',
        expect.anything(),
      );
      expect(response.clearCookie).toHaveBeenCalledWith(
        'eevee_refresh',
        expect.anything(),
      );
      expect(authService.refreshSession).not.toHaveBeenCalled();
    });

    it('rejects and clears both cookies when the session was denied', async () => {
      authService.refreshSession.mockResolvedValue({ status: 'denied' });
      const response = buildResponse();

      await expect(
        controller.refresh(
          { headers: { cookie: 'eevee_refresh=token' } } as any,
          response,
        ),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(response.clearCookie).toHaveBeenCalledTimes(2);
      expect(response.cookie).not.toHaveBeenCalled();
    });

    it('answers 409 and keeps the cookies on a race', async () => {
      authService.refreshSession.mockResolvedValue({ status: 'raced' });
      const response = buildResponse();

      await expect(
        controller.refresh(
          { headers: { cookie: 'eevee_refresh=token' } } as any,
          response,
        ),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(response.clearCookie).not.toHaveBeenCalled();
      expect(response.cookie).not.toHaveBeenCalled();
    });

    it('writes both cookies and returns the session on success', async () => {
      authService.refreshSession.mockResolvedValue({
        status: 'refreshed',
        accessToken: 'novo-access',
        refreshToken: 'novo-refresh',
        session: { userId: 12, email: 'admin@example.com', isAdmin: true },
      });
      const response = buildResponse();

      await expect(
        controller.refresh(
          { headers: { cookie: 'eevee_refresh=token' } } as any,
          response,
        ),
      ).resolves.toEqual({
        userId: 12,
        email: 'admin@example.com',
        isAdmin: true,
      });

      expect(response.cookie).toHaveBeenCalledWith(
        'eevee_auth',
        'novo-access',
        expect.objectContaining({ path: '/' }),
      );
      expect(response.cookie).toHaveBeenCalledWith(
        'eevee_refresh',
        'novo-refresh',
        expect.objectContaining({ path: '/auth/refresh' }),
      );
    });
  });
});
