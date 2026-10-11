import { UserRole } from 'src/user/user-role';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const configService = {
    get: jest.fn().mockReturnValue('test-secret'),
  };
  const userService = { findOne: jest.fn() };
  const strategy = new JwtStrategy(
    configService as unknown as ConfigService,
    userService as any
  );

  it('builds the request user from the active account and keeps the session claims', async () => {
    userService.findOne.mockResolvedValue({
      id: 13,
      email: 'user@example.com',
      role: UserRole.ADMIN
    });

    await expect(strategy.validate({
        userId: 13,
        email: 'user@example.com',
        role: UserRole.ADMIN,
        familyId: 'family-1',
        exp: 1893456000,
      })).resolves.toEqual({
      userId: 13,
      email: 'user@example.com',
      role: UserRole.ADMIN,
      familyId: 'family-1',
      exp: 1893456000,
    });
  });

  it('uses the current role and email instead of stale token claims', async () => {
    userService.findOne.mockResolvedValue({
      id: 13,
      email: 'novo@example.com',
      role: UserRole.TEACHER
    });

    await expect(
      strategy.validate({
        userId: 13,
        email: 'antigo@example.com',
        role: UserRole.STUDENT
      }))
      .resolves.toMatchObject(
        {
          userId: 13,
          email: 'novo@example.com',
          role: UserRole.TEACHER
        }
      );
  });

  it('rejects a deactivated account', async () => {
    userService.findOne.mockResolvedValue(null);

    await expect(strategy.validate({ userId: 13 } as any)).rejects.toThrow('Account is inactive or unavailable.');
  });
});
