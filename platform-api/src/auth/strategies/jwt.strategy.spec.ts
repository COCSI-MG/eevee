import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/user/user.service';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const configService = {
    get: jest.fn().mockReturnValue('test-secret'),
  };
  const userService = { findOne: jest.fn() };
  const strategy = new JwtStrategy(
    configService as unknown as ConfigService,
    userService as unknown as UserService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('rejects a token when its user has been soft deleted', async () => {
    userService.findOne.mockResolvedValue(null);

    await expect(
      strategy.validate({
        userId: 13,
        email: 'deleted@example.com',
        isAdmin: false,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('uses current active-user data instead of stale token claims', async () => {
    userService.findOne.mockResolvedValue({
      id: 13,
      email: 'current@example.com',
      isAdmin: true,
    });

    await expect(
      strategy.validate({
        userId: 13,
        email: 'old@example.com',
        isAdmin: false,
      }),
    ).resolves.toEqual({
      userId: 13,
      email: 'current@example.com',
      isAdmin: true,
    });
  });
});
