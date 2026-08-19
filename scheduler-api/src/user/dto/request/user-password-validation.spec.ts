import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateUserDto } from './create-user.dto';
import { UpdateUserDto } from './update-user.dto';

describe('user password validation', () => {
  const validUser = {
    email: 'student@example.com',
    name: 'Student',
    isAdmin: false,
  };

  it('requires a password with at least eight characters when creating', async () => {
    const missingPassword = await validate(
      plainToInstance(CreateUserDto, validUser),
    );

    const shortPassword = await validate(
      plainToInstance(CreateUserDto, {
        ...validUser,
        password: 'short',
      }),
    );

    expect(missingPassword).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ property: 'password' }),
      ]),
    );

    expect(shortPassword).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ property: 'password' }),
      ]),
    );
  });

  it('accepts an omitted password when updating', async () => {
    const errors = await validate(
      plainToInstance(UpdateUserDto, { isAdmin: true }),
    );

    expect(errors).toEqual([]);
  });

  it('rejects an empty or short password when updating', async () => {
    const emptyPassword = await validate(
      plainToInstance(UpdateUserDto, { password: '' }),
    );

    const shortPassword = await validate(
      plainToInstance(UpdateUserDto, { password: 'short' }),
    );

    expect(emptyPassword).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ property: 'password' }),
      ]),
    );

    expect(shortPassword).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ property: 'password' }),
      ]),
    );
  });
});
