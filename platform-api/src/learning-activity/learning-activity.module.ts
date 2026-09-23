import {
  Body,
  Controller,
  Get,
  Module,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { RequestContextModule } from 'src/request-context/request-context.module';
import {
  LearningActivity,
  LearningQuizAttempt,
} from './learning-activity.entity';
import { LearningActivityDto, SubmitQuizDto } from './learning-activity.dto';
import { LearningActivityService } from './learning-activity.service';

@Controller('learning-activity')
@UseGuards(JwtAuthGuard)
export class LearningActivityController {
  constructor(private readonly service: LearningActivityService) {}
  @Get('class/:classId') list(@Param('classId', ParseIntPipe) id: number) {
    return this.service.list(id);
  }
  @Get(':id') get(@Param('id', ParseIntPipe) id: number) {
    return this.service.get(id);
  }
  @Get(':id/attempts') attempts(@Param('id', ParseIntPipe) id: number) {
    return this.service.attempts(id);
  }
  @Post() @UseGuards(AdminGuard) create(@Body() dto: LearningActivityDto) {
    return this.service.create(dto);
  }
  @Put(':id') @UseGuards(AdminGuard) update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: LearningActivityDto,
  ) {
    return this.service.update(id, dto);
  }
  @Post(':id/submit') submit(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SubmitQuizDto,
  ) {
    return this.service.submit(id, dto);
  }
}
@Module({
  imports: [
    TypeOrmModule.forFeature([LearningActivity, LearningQuizAttempt]),
    RequestContextModule,
  ],
  controllers: [LearningActivityController],
  providers: [LearningActivityService],
})
export class LearningActivityModule {}
