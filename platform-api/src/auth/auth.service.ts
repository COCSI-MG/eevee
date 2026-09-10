import { Injectable } from '@nestjs/common';
import { LoginRequestDto } from './dto/request/login-request.dto';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { HashUtils } from 'src/utils/hash.utils';
import { JwtPayload } from './jwt.interface';
import { RegisterRequestDto } from './dto/request/register-request.dto';
import { AuthSessionResponseDto } from './dto/response/auth-session-response.dto';
import { RefreshSessionService } from './refresh-session.service';
import { SessionStatus } from './enums/session-status.enum';

export interface StartedSession {
  accessToken: string;
  refreshToken: string;
  session: AuthSessionResponseDto;
}

export type RefreshOutcome =
  | {
      status: SessionStatus.REFRESHED;
      accessToken: string;
      refreshToken: string;
      session: AuthSessionResponseDto;
    }
  | { status: SessionStatus.RACED }
  | { status: SessionStatus.DENIED };

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly refreshSessionService: RefreshSessionService,
  ) {}

  async refreshSession(rawToken: string): Promise<RefreshOutcome> {
    const rotation = await this.refreshSessionService.rotate(rawToken);

    if (rotation.status !== SessionStatus.ROTATED) {
      return { status: rotation.status };
    }

    const user = await this.userService.findOne(rotation.session.userId);

    if (!user) {
      await this.refreshSessionService.revokeFamily(rotation.session.familyId);
      return { status: SessionStatus.DENIED };
    }

    const payload: JwtPayload = {
      email: user.email,
      userId: user.id,
      isAdmin: user.isAdmin,
      familyId: rotation.session.familyId,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      status: SessionStatus.REFRESHED,
      accessToken,
      refreshToken: rotation.token,
      session: this.buildSession(this.withTokenExpiry(payload, accessToken)),
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

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      refreshToken,
      session: this.buildSession(this.withTokenExpiry(payload, accessToken)),
    };
  }

  private withTokenExpiry(payload: JwtPayload, token: string): JwtPayload {
    const { exp } = this.jwtService.decode(token) as { exp?: number };

    return { ...payload, exp };
  }

  buildSession(payload: JwtPayload): AuthSessionResponseDto {
    const expiresIn = payload.exp
      ? Math.max(0, payload.exp - Math.floor(Date.now() / 1000))
      : 0;

    return {
      userId: payload.userId,
      email: payload.email,
      isAdmin: payload.isAdmin,
      expiresIn,
    };
  }
}
