import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from 'src/user/user-role';
import {
  AcceptInvitationDto,
  CreateInvitationDto,
  InvitationTokenDto,
} from './invitation.dto';
import { InvitationService } from './invitation.service';

@Controller('invitation')
export class InvitationController {
  constructor(private readonly service: InvitationService) {}
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  list(@Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number) {
    return this.service.list(Math.max(1, page));
  }
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  create(@Body() dto: CreateInvitationDto) {
    return this.service.create(dto);
  }
  @Post(':id/resend')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  resend(@Param('id', ParseIntPipe) id: number) {
    return this.service.resend(id);
  }
  @Post(':id/revoke')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  revoke(@Param('id', ParseIntPipe) id: number) {
    return this.service.revoke(id);
  }
  @Post('inspect')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  inspect(@Body() dto: InvitationTokenDto) {
    return this.service.inspect(dto.token);
  }
  @Post('accept')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  accept(@Body() dto: AcceptInvitationDto) {
    return this.service.accept(dto);
  }
}
