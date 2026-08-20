import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  InternalServerErrorException,
  Res,
  Get,
  UseGuards,
  Req,
  HttpCode,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginRequestDto } from './dto/request/login-request.dto';
import { ApiInternalServerErrorResponse, ApiNoContentResponse, ApiOkResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { LoginResponseDto } from './dto/response/login-response.dto';
import { RegisterRequestDto } from './dto/request/register-request.dto';
import { RegisterResponseDto } from './dto/response/register-response.dto';
import { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { clearAuthCookie, setAuthCookie } from './auth-cookie.util';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthSessionResponseDto } from './dto/response/auth-session-response.dto';
import { SkipThrottle, Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiUnauthorizedResponse()
  async create(
    @Body() loginAuthDto: LoginRequestDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.validateUserAndLogin(loginAuthDto);

    if (result) {
      setAuthCookie(response, result.token, this.configService);
      return result.session;
    }

    throw new UnauthorizedException();
  }

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOkResponse({ type: RegisterResponseDto })
  @ApiInternalServerErrorResponse()
  async register(
    @Body() registerAuthDto: RegisterRequestDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.registerUser(registerAuthDto);
    if (result) {
      setAuthCookie(response, result.token, this.configService);
      return result.session;
    }
    throw new InternalServerErrorException(
      'An error occurred while trying to register the user. Please try again later.',
    );
  }

  @Get('me')
  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: AuthSessionResponseDto })
  @ApiUnauthorizedResponse()
  getMe(@Req() request: Request & { user: AuthSessionResponseDto }) {
    return request.user;
  }

  @Post('logout')
  @SkipThrottle()
  @HttpCode(204)
  @ApiNoContentResponse()
  logout(@Res({ passthrough: true }) response: Response) {
    clearAuthCookie(response, this.configService);
  }
}
