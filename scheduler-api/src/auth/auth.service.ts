import { ConflictException, Injectable } from '@nestjs/common';
import { LoginRequestDto } from './dto/request/login-request.dto';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { HashUtils } from 'src/utils/hash.utils';
import { JwtPayload } from './jwt.interface';
import { LoginResponseDto } from './dto/response/login-response.dto';
import { RegisterRequestDto } from './dto/request/register-request.dto';
import { AuthSessionResponseDto } from './dto/response/auth-session-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUserAndLogin(
    loginData: LoginRequestDto,
  ): Promise<{ session: LoginResponseDto; token: string } | undefined> {
    const { email, password } = loginData;
    const user = await this.userService.findByEmail(email);
    if (
      user &&
      (HashUtils.comparePassword(password, user.passwordHash))
    ) {
      const payload: JwtPayload = {
        email: user.email,
        userId: user.id,
        isAdmin: user.isAdmin,
      };

      const token = this.jwtService.sign(payload);

      return {
        token,
        session: {
          userId: user.id,
          email: user.email,
          isAdmin: user.isAdmin,
        },
      };
    }
  }

  async registerUser(
    registerData: RegisterRequestDto,
  ): Promise<{ session: LoginResponseDto; token: string }> {
    const { email } = registerData;
    const user = await this.userService.findByEmail(email);
    if (user) {
      throw new ConflictException('Unable to create an account with the provided information.');
    }

    const createdUser = await this.userService.createOrReplace({
      ...registerData,
      email,
      isAdmin: false,
    });

    const payload: JwtPayload = {
      email: createdUser.email,
      userId: createdUser.id,
      isAdmin: false,
    };

    const token = this.jwtService.sign(payload);

    return {
      token,
      session: {
        userId: createdUser.id,
        email: createdUser.email,
        isAdmin: false,
      },
    };
  }

  buildSession(payload: JwtPayload): AuthSessionResponseDto {
    return {
      userId: payload.userId,
      email: payload.email,
      isAdmin: payload.isAdmin,
    };
  }
}
