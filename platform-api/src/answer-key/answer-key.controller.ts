import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { CreateAnswerKeyDto } from './dto/create-answer-key.dto';
import { UpdateAnswerKeyDto } from './dto/update-answer-key.dto';
import { AnswerKeyService } from './answer-key.service';
import { UserRole } from 'src/user/user-role';

type AuthenticatedRequest = Request & { user: { role: UserRole } };

@Controller('assignment/:assignmentId/answer-key')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnswerKeyController {
  constructor(private readonly answerKeyService: AnswerKeyService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  create(
    @Param('assignmentId') assignmentId: string,
    @Body() dto: CreateAnswerKeyDto,
  ) {
    return this.answerKeyService.create(+assignmentId, dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  findOne(
    @Param('assignmentId') assignmentId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.answerKeyService.findOne(+assignmentId, request.user.role);
  }

  @Put()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  update(
    @Param('assignmentId') assignmentId: string,
    @Body() dto: UpdateAnswerKeyDto,
  ) {
    return this.answerKeyService.update(+assignmentId, dto);
  }

  @Delete()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  remove(@Param('assignmentId') assignmentId: string) {
    return this.answerKeyService.remove(+assignmentId);
  }
}
