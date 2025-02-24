import { Injectable } from '@nestjs/common';
import { LoginRequestDto } from './dto/request/login-request.dto';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { HashUtils } from 'src/utils/hash.utils';
import { JwtPayload } from './jwt.interface';
import { LoginResponseDto } from './dto/response/login-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUserAndLogin(
    loginData: LoginRequestDto,
  ): Promise<LoginResponseDto | undefined> {
    const { email, password } = loginData;
    const user = await this.userService.findByEmail(email);
    if (
      user &&
      (await HashUtils.comparePassword(password, user.passwordHash))
    ) {
      const payload: JwtPayload = {
        email: user.email,
        userId: user.id,
        isAdmin: user.isAdmin,
      };
      return {
        token: this.jwtService.sign(payload),
        isAdmin: user.isAdmin,
      };
    }
  }
}
