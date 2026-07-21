import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateAssignmentDto } from 'src/assignment/dto/create-assignment.dto';
import { CreateExamDto } from './dto/create-exam.dto';
import { ListExamsByClassQueryDto } from './dto/list-exams-by-class.query.dto';
import { CreateActivityAndLinkResponseDto } from './dto/response/create-activity-and-link-response.dto';
import { ExamActivityResponseDto } from './dto/response/exam-activity-response.dto';
import { ExamResponseDto } from './dto/response/exam-response.dto';
import { PaginatedExamsResponseDto } from './dto/response/paginated-exams-response.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { ExamService } from './exam.service';

@ApiTags('Exam')
@Controller('exam')
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  @Post()
  @ApiCreatedResponse({
    type: ExamResponseDto,
    description: 'Exam created successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid body (e.g. title missing/blank or longer than 100 chars)',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  @ApiForbiddenResponse({ description: 'User is not an admin' })
  @ApiNotFoundResponse({
    description: 'classId references a non-existent class',
  })
  @UseGuards(AdminGuard)
  create(@Body() createExamDto: CreateExamDto) {
    return this.examService.create(createExamDto);
  }

  @Get('class/:classId')
  @ApiOkResponse({ type: PaginatedExamsResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  @ApiForbiddenResponse({
    description: 'User is not enrolled in this class',
  })
  @ApiNotFoundResponse({ description: 'Class not found' })
  @UseGuards(JwtAuthGuard)
  findByClass(
    @Param('classId') classId: string,
    @Query() query: ListExamsByClassQueryDto,
  ) {
    return this.examService.findByClass(+classId, query);
  }

  @Post(':examId/activities')
  @ApiCreatedResponse({
    type: CreateActivityAndLinkResponseDto,
    description: 'Activity created and linked to the exam',
  })
  @ApiBadRequestResponse({
    description:
      'classId in body does not match the exam.classId',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  @ApiForbiddenResponse({ description: 'User is not an admin' })
  @ApiNotFoundResponse({
    description:
      'Exam not found, or classId references a non-existent class',
  })
  @ApiConflictResponse({
    description:
      'Activity could not be linked to the exam; transaction rolled back',
  })
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.CREATED)
  async createActivityAndLink(
    @Param('examId') examId: string,
    @Body() createAssignmentDto: CreateAssignmentDto,
  ) {
    return this.examService.createActivityAndLink(+examId, createAssignmentDto);
  }

  @Post(':examId/activities/:activityId')
  @ApiCreatedResponse({
    type: ExamActivityResponseDto,
    description: 'Link created successfully',
  })
  @ApiNotFoundResponse({
    description: 'Exam or Activity with the provided id does not exist',
  })
  @ApiConflictResponse({
    description: 'Activity is already linked to an exam',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  @ApiForbiddenResponse({ description: 'User is not an admin' })
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.CREATED)
  async linkActivity(
    @Param('examId') examId: string,
    @Param('activityId') activityId: string,
  ) {
    return this.examService.linkActivity(+examId, +activityId);
  }

  @Patch(':id')
  @ApiOkResponse({ type: ExamResponseDto })
  @ApiBadRequestResponse({
    description: 'Invalid body (e.g. title longer than 100 chars)',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  @ApiForbiddenResponse({ description: 'User is not an admin' })
  @ApiNotFoundResponse({ description: 'Exam not found' })
  @UseGuards(AdminGuard)
  update(@Param('id') id: string, @Body() updateExamDto: UpdateExamDto) {
    return this.examService.update(+id, updateExamDto);
  }

  @Delete(':id')
  @ApiOkResponse({ description: 'Exam and its activity links deleted' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  @ApiForbiddenResponse({ description: 'User is not an admin' })
  @ApiNotFoundResponse({ description: 'Exam not found' })
  @UseGuards(AdminGuard)
  remove(@Param('id') id: string) {
    return this.examService.remove(+id);
  }
}
