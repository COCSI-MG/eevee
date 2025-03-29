import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginRequestDto } from './dto/request/login-request.dto';
import { ApiInternalServerErrorResponse, ApiOkResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { LoginResponseDto } from './dto/response/login-response.dto';
import { RegisterRequestDto } from './dto/request/register-request.dto';
import { RegisterResponseDto } from './dto/response/register-response.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiUnauthorizedResponse()
  async create(@Body() loginAuthDto: LoginRequestDto) {
    const result = await this.authService.validateUserAndLogin(loginAuthDto);

    if (result) {
      return result;
    }

    throw new UnauthorizedException();
  }

  @Post('register')
  @ApiOkResponse({ type: RegisterResponseDto })
  @ApiInternalServerErrorResponse()
  async register(@Body() registerAuthDto: RegisterRequestDto) {
    const result = await this.authService.registerUser(registerAuthDto);
    if (result) {
      return result;
    }
    throw new InternalServerErrorException(
      'An error occurred while trying to register the user. Please try again later.',
    );
  }
}
