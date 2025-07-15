import { NestMiddleware, Injectable } from '@nestjs/common';
import * as passport from 'passport';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from 'src/auth/strategies/jwt.strategy';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(
    configService: ConfigService,
    private readonly clsService: ClsService,
  ) {
    passport.use(new JwtStrategy(configService));
  }

  async use(req: any, res: any, next: (error?: any) => void) {
    passport.authenticate('jwt', { session: false }, (err, user, info) => {
      console.log('user', user);
      if (err || !user) {
        next();
        return;
      }
      this.clsService.set('user', user);
      next();
    })(req, res, next);
  }
}
