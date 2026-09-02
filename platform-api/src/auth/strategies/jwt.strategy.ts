import { Strategy, ExtractJwt } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { JwtPayload } from '../jwt.interface';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { getTokenFromCookieHeader } from '../auth-cookie.util';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => getTokenFromCookieHeader(request?.headers?.cookie),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'), // Use the environment variable
    });
  }

  validate(payload: JwtPayload): JwtPayload {
    return {
      userId: payload.userId,
      email: payload.email,
      isAdmin: payload.isAdmin,
      familyId: payload.familyId,
      exp: payload.exp,
    };
  }
}
