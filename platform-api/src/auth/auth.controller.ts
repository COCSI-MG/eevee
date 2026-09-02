import {
  Controller,
  Post,
  Body,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
  Res,
  Get,
  UseGuards,
  Req,
  HttpCode,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { PasswordResetService } from './password-reset.service';
import { LoginRequestDto } from './dto/request/login-request.dto';
import { ResetPasswordRequestDto } from './dto/request/reset-password-request.dto';
import { ResetPasswordConfirmDto } from './dto/request/reset-password-confirm.dto';
import {
  ApiConflictResponse,
  ApiInternalServerErrorResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { LoginResponseDto } from './dto/response/login-response.dto';
import { RegisterRequestDto } from './dto/request/register-request.dto';
import { RegisterResponseDto } from './dto/response/register-response.dto';
import { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import {
  clearAuthCookie,
  clearRefreshCookie,
  getRefreshTokenFromCookieHeader,
  setAuthCookie,
  setRefreshCookie,
} from './auth-cookie.util';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtPayload } from './jwt.interface';
import { SessionStatus } from './enums/session-status.enum';
import { RequestContextService } from 'src/request-context/request-context.service';
import { AuthSessionResponseDto } from './dto/response/auth-session-response.dto';
import { SkipThrottle, Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly passwordResetService: PasswordResetService,
    private readonly configService: ConfigService,
    private readonly requestContextService: RequestContextService,
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
      setAuthCookie(response, result.accessToken, this.configService);
      setRefreshCookie(response, result.refreshToken, this.configService);
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
      setAuthCookie(response, result.accessToken, this.configService);
      setRefreshCookie(response, result.refreshToken, this.configService);
      return result.session;
    }
    throw new InternalServerErrorException(
      'An error occurred while trying to register the user. Please try again later.',
    );
  }

  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOkResponse({ schema: { properties: { message: { type: 'string' } } } })
  async forgotPassword(@Body() resetPasswordDto: ResetPasswordRequestDto) {
    return this.passwordResetService.requestReset(resetPasswordDto.email);
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOkResponse({ schema: { properties: { message: { type: 'string' } } } })
  async resetPassword(@Body() dto: ResetPasswordConfirmDto) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('As senhas não conferem');
    }

    const result = await this.passwordResetService.resetPassword(
      dto.token,
      dto.newPassword,
    );

    if (!result.success) {
      throw new BadRequestException('Token inválido ou expirado');
    }

    return { message: 'Senha alterada com sucesso' };
  }

  @Post('refresh')
  @ApiOkResponse({ type: AuthSessionResponseDto })
  @ApiUnauthorizedResponse()
  @ApiConflictResponse({ description: 'Outra requisição já renovou a sessão' })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const denySession = () => {
      clearAuthCookie(response, this.configService);
      clearRefreshCookie(response, this.configService);
      return new UnauthorizedException();
    };

    const refreshToken = getRefreshTokenFromCookieHeader(
      request.headers?.cookie,
    );

    if (!refreshToken) {
      throw denySession();
    }

    const result = await this.authService.refreshSession(refreshToken);

    if (result.status === SessionStatus.RACED) {
      throw new ConflictException('Sessão já renovada por outra requisição');
    }

    if (result.status !== SessionStatus.REFRESHED) {
      throw denySession();
    }

    setAuthCookie(response, result.accessToken, this.configService);
    setRefreshCookie(response, result.refreshToken, this.configService);

    return result.session;
  }

  @Get('me')
  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: AuthSessionResponseDto })
  @ApiUnauthorizedResponse()
  getMe(@Req() request: Request & { user: JwtPayload }) {
    return this.authService.buildSession(request.user);
  }

  @Post('logout')
  @SkipThrottle()
  @HttpCode(204)
  @ApiNoContentResponse()
  async logout(@Res({ passthrough: true }) response: Response) {
    await this.authService.endSession(
      this.requestContextService.getUser()?.familyId,
    );

    clearAuthCookie(response, this.configService);
    clearRefreshCookie(response, this.configService);
  }
}
