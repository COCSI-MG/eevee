import { UserRole } from 'src/user/user-role';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const configService = {
    get: jest.fn().mockReturnValue('test-secret'),
  };
  const strategy = new JwtStrategy(configService as unknown as ConfigService);

  it('builds the request user from the token claims', () => {
    expect(
      strategy.validate({
        userId: 13,
        email: 'user@example.com',
        role: UserRole.ADMIN,
        familyId: 'family-1',
        exp: 1893456000,
      }),
    ).toEqual({
      userId: 13,
      email: 'user@example.com',
      role: UserRole.ADMIN,
      familyId: 'family-1',
      exp: 1893456000,
    });
  });

  it('keeps trusting the claims while the token is valid', () => {
    expect(
      strategy.validate({
        userId: 13,
        email: 'antigo@example.com',
        role: UserRole.STUDENT
      }),
    ).toMatchObject({
      userId: 13,
      email: 'antigo@example.com',
      role: UserRole.STUDENT
    });
  });
});
