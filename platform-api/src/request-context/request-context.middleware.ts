import { NestMiddleware, Injectable } from '@nestjs/common';
import * as passport from 'passport';
import { ConfigService } from '@nestjs/config';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(
    private readonly configService: ConfigService,
    private readonly clsService: ClsService,
  ) {}

  async use(req: any, res: any, next: (error?: any) => void) {
    const isDevEnv = this.configService.get<string>('ENV') === 'local';
    if (isDevEnv && this.clsService.get('user')) {
      return next();
    }

    passport.authenticate('jwt', { session: false }, (err, user, info) => {
      if (err || !user) {
        next();
        return;
      }
      this.clsService.set('user', user);
      next();
    })(req, res, next);
  }
}
 
