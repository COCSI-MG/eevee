import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { JwtPayload } from 'src/auth/jwt.interface';

@Injectable()
export class RequestContextService {
  constructor(private readonly clsService: ClsService) {}
  getUser() {
    return <JwtPayload>this.clsService.get('user');
  }
  set(key, value) {
    return this.clsService.set(key, value);
  }
}
