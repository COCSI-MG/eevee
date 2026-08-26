import { Injectable } from '@nestjs/common';
import { LoginRequestDto } from './dto/request/login-request.dto';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { HashUtils } from 'src/utils/hash.utils';
import { JwtPayload } from './jwt.interface';
import { LoginResponseDto } from './dto/response/login-response.dto';
import { RegisterRequestDto } from './dto/request/register-request.dto';
import { AuthSessionResponseDto } from './dto/response/auth-session-response.dto';
import { RefreshSessionService } from './refresh-session.service';

export type RefreshOutcome =
  | {
      status: 'refreshed';
      accessToken: string;
      refreshToken: string;
      session: AuthSessionResponseDto;
    }
  | { status: 'raced' }
  | { status: 'denied' };

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly refreshSessionService: RefreshSessionService,
  ) {}

  async refreshSession(rawToken: string): Promise<RefreshOutcome> {
    const rotation = await this.refreshSessionService.rotate(rawToken);

    if (rotation.status !== 'rotated') {
      return { status: rotation.status === 'raced' ? 'raced' : 'denied' };
    }

    const user = await this.userService.findOne(rotation.session.userId);

    if (!user) {
      await this.refreshSessionService.revokeFamily(rotation.session.familyId);
      return { status: 'denied' };
    }

    const payload: JwtPayload = {
      email: user.email,
      userId: user.id,
      isAdmin: user.isAdmin,
      familyId: rotation.session.familyId,
    };

    return {
      status: 'refreshed',
      accessToken: this.jwtService.sign(payload),
      refreshToken: rotation.token,
      session: {
        userId: user.id,
        email: user.email,
        isAdmin: user.isAdmin,
      },
    };
  }

  async validateUserAndLogin(
    loginData: LoginRequestDto,
  ): Promise<{ session: LoginResponseDto; token: string } | undefined> {
    const { email, password } = loginData;
    const user = await this.userService.findByEmail(email);

    console.log('User pass hash', user?.passwordHash);

    if (user && HashUtils.comparePassword(password, user.passwordHash)) {
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
  ): Promise<{ session: LoginResponseDto; token: string } | undefined> {
    const { email } = registerData;
    const user = await this.userService.findByEmail(email);
    if (!user) {
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
  }

  buildSession(payload: JwtPayload): AuthSessionResponseDto {
    return {
      userId: payload.userId,
      email: payload.email,
      isAdmin: payload.isAdmin,
    };
  }
}
