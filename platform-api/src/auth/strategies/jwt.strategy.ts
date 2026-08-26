import { Strategy, ExtractJwt } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtPayload } from '../jwt.interface';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { getTokenFromCookieHeader } from '../auth-cookie.util';
import { UserService } from 'src/user/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => getTokenFromCookieHeader(request?.headers?.cookie),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'), // Use the environment variable
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const user = await this.userService.findOne(payload.userId);
    if (!user) throw new UnauthorizedException('User no longer exists');

    return {
      userId: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
      familyId: payload.familyId,
      exp: payload.exp,
    };
  }
}
