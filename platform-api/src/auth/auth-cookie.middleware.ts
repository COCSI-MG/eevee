import { Injectable, NestMiddleware } from '@nestjs/common';
import { parseCookieHeader } from './auth-cookie.util';

@Injectable()
export class CookieParserMiddleware implements NestMiddleware {
  use(req: any, _res: any, next: (error?: any) => void) {
    req.cookies = {
      ...parseCookieHeader(req.headers?.cookie),
      ...(req.cookies ?? {}),
    };
    next();
  }
}
