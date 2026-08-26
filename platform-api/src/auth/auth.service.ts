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

export interface StartedSession {
  accessToken: string;
  refreshToken: string;
  session: AuthSessionResponseDto;
}

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

  async validateUserAndLogin(loginData: LoginRequestDto) {
    const { email, password } = loginData;
    const user = await this.userService.findByEmail(email);

    if (user && HashUtils.comparePassword(password, user.passwordHash)) {
      return this.startSession({
        id: user.id,
        email: user.email,
        isAdmin: user.isAdmin,
      });
    }
  }

  async registerUser(registerData: RegisterRequestDto) {
    const { email } = registerData;
    const user = await this.userService.findByEmail(email);

    if (!user) {
      const createdUser = await this.userService.createOrReplace({
        ...registerData,
        email,
        isAdmin: false,
      });

      return this.startSession({
        id: createdUser.id,
        email: createdUser.email,
        isAdmin: false,
      });
    }
  }

  async endSession(familyId?: string) {
    if (!familyId) {
      return;
    }

    await this.refreshSessionService.revokeFamily(familyId);
  }

  private async startSession(user: {
    id: number;
    email: string;
    isAdmin: boolean;
  }): Promise<StartedSession> {
    const { token: refreshToken, session } =
      await this.refreshSessionService.create(user.id);

    const payload: JwtPayload = {
      email: user.email,
      userId: user.id,
      isAdmin: user.isAdmin,
      familyId: session.familyId,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken,
      session: {
        userId: user.id,
        email: user.email,
        isAdmin: user.isAdmin,
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
