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
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { CreateAnswerKeyDto } from './dto/create-answer-key.dto';
import { UpdateAnswerKeyDto } from './dto/update-answer-key.dto';
import { AnswerKeyService } from './answer-key.service';

type AuthenticatedRequest = Request & { user: { isAdmin: boolean } };

@Controller('assignment/:assignmentId/answer-key')
@UseGuards(JwtAuthGuard)
export class AnswerKeyController {
  constructor(private readonly answerKeyService: AnswerKeyService) {}

  @Post()
  @UseGuards(AdminGuard)
  create(
    @Param('assignmentId') assignmentId: string,
    @Body() dto: CreateAnswerKeyDto,
  ) {
    return this.answerKeyService.create(+assignmentId, dto);
  }

  @Get()
  findOne(
    @Param('assignmentId') assignmentId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.answerKeyService.findOne(+assignmentId, request.user.isAdmin);
  }

  @Put()
  @UseGuards(AdminGuard)
  update(
    @Param('assignmentId') assignmentId: string,
    @Body() dto: UpdateAnswerKeyDto,
  ) {
    return this.answerKeyService.update(+assignmentId, dto);
  }

  @Delete()
  @UseGuards(AdminGuard)
  remove(@Param('assignmentId') assignmentId: string) {
    return this.answerKeyService.remove(+assignmentId);
  }
}
