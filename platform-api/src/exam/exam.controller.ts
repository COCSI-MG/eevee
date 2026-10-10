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
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from 'src/user/user-role';
import { CreateAndLinkAssignmentDto } from './dto/create-and-link-assignment.dto';
import { CreateExamDto } from './dto/create-exam.dto';
import { LinkAssignmentDto } from './dto/link-assignment.dto';
import { ListExamStudentsQueryDto } from './dto/list-exam-students.query.dto';
import { ListExamsByClassQueryDto } from './dto/list-exams-by-class.query.dto';
import { CreateAssignmentAndLinkResponseDto } from './dto/response/create-activity-and-link-response.dto';
import { ExamAssignmentResponseDto } from './dto/response/exam-activity-response.dto';
import { PaginatedExamStudentsResponseDto } from './dto/response/paginated-exam-students-response.dto';
import { ExamResponseDto } from './dto/response/exam-response.dto';
import { ExamWithAssignmentsResponseDto } from './dto/response/exam-with-activities-response.dto';
import { PaginatedExamsResponseDto } from './dto/response/paginated-exams-response.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { ExamService } from './exam.service';

@ApiTags('Exam')
@Controller('exam')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExamController {
  constructor(
    private readonly examService: ExamService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiCreatedResponse({
    type: ExamResponseDto,
    description: 'Exam created successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid body (e.g. title missing/blank or longer than 100 chars)',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  @ApiForbiddenResponse({ description: 'User cannot manage the selected class' })
  @ApiNotFoundResponse({
    description: 'classId references a non-existent class',
  })
  create(@Body() createExamDto: CreateExamDto) {
    return this.examService.create(createExamDto);
  }

  @Get('class/:classId')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  @ApiOkResponse({ type: PaginatedExamsResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  @ApiForbiddenResponse({
    description: 'User is not enrolled in this class',
  })
  @ApiNotFoundResponse({ description: 'Class not found' })
  findByClass(
    @Param('classId') classId: string,
    @Query() query: ListExamsByClassQueryDto,
  ) {
    return this.examService.findByClass(+classId, query);
  }

  @Get(':idExam/student')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOkResponse({ type: PaginatedExamStudentsResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  @ApiForbiddenResponse({ description: 'User cannot manage the selected class' })
  @ApiNotFoundResponse({ description: 'Exam not found' })
  findStudents(
    @Param('idExam') idExam: string,
    @Query() query: ListExamStudentsQueryDto,
  ) {
    return this.examService.findStudentsByExam(+idExam, query);
  }

  @Get(':idExam')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  @ApiOkResponse({ type: ExamWithAssignmentsResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  @ApiForbiddenResponse({
    description:
      'User is not enrolled in the class of this exam, or the exam has no class',
  })
  @ApiNotFoundResponse({ description: 'Exam not found' })
  findOne(@Param('idExam') idExam: string) {
    return this.examService.findOneWithAssignments(+idExam);
  }

  @Post(':examId/assignments')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiCreatedResponse({
    type: CreateAssignmentAndLinkResponseDto,
    description: 'Assignment created and linked to the exam',
  })
  @ApiBadRequestResponse({
    description:
      'classId in body does not match the exam.classId',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  @ApiForbiddenResponse({ description: 'User cannot manage the selected class' })
  @ApiNotFoundResponse({
    description:
      'Exam not found, or classId references a non-existent class',
  })
  @ApiConflictResponse({
    description:
      'Assignment could not be linked to the exam; transaction rolled back',
  })
  @HttpCode(HttpStatus.CREATED)
  async createAssignmentAndLink(
    @Param('examId') examId: string,
    @Body() createAssignmentDto: CreateAndLinkAssignmentDto,
  ) {
    return this.examService.createAssignmentAndLink(+examId, createAssignmentDto);
  }

  @Post(':examId/assignments/:assignmentId')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiCreatedResponse({
    type: ExamAssignmentResponseDto,
    description: 'Link created successfully',
  })
  @ApiNotFoundResponse({
    description: 'Exam or Assignment with the provided id does not exist',
  })
  @ApiConflictResponse({
    description: 'Assignment is already linked to an exam',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  @ApiForbiddenResponse({ description: 'User cannot manage the selected class' })
  @HttpCode(HttpStatus.CREATED)
  async linkAssignment(
    @Param('examId') examId: string,
    @Param('assignmentId') assignmentId: string,
    @Body() dto: LinkAssignmentDto,
  ) {
    return this.examService.linkAssignment(+examId, +assignmentId, dto.score);
  }

  @Delete(':idExam/assignments/:assignmentId')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiNoContentResponse({
    description: 'Assignment successfully unlinked from the exam',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  @ApiForbiddenResponse({ description: 'User cannot manage the selected class' })
  @ApiNotFoundResponse({
    description:
      'Exam not found, Assignment not found, or the link between them does not exist',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async unlinkAssignment(
    @Param('idExam') idExam: string,
    @Param('assignmentId') assignmentId: string,
  ): Promise<void> {
    await this.examService.unlinkAssignment(+idExam, +assignmentId);
  }

  @Patch(':examId/assignments/:assignmentId')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOkResponse({
    type: ExamAssignmentResponseDto,
    description: 'Assignment score updated successfully',
  })
  @ApiBadRequestResponse({
    description: 'score must be greater than 0',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  @ApiForbiddenResponse({ description: 'User cannot manage the selected class' })
  @ApiNotFoundResponse({
    description:
      'Exam not found, Assignment not found, or the link between them does not exist',
  })
  async updateAssignmentScore(
    @Param('examId') examId: string,
    @Param('assignmentId') assignmentId: string,
    @Body() dto: LinkAssignmentDto,
  ) {
    return this.examService.updateAssignmentScore(+examId, +assignmentId, dto.score);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOkResponse({ type: ExamResponseDto })
  @ApiBadRequestResponse({
    description: 'Invalid body (e.g. title longer than 100 chars)',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  @ApiForbiddenResponse({ description: 'User cannot manage the selected class' })
  @ApiNotFoundResponse({ description: 'Exam not found' })
  update(@Param('id') id: string, @Body() updateExamDto: UpdateExamDto) {
    return this.examService.update(+id, updateExamDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOkResponse({ description: 'Exam and its assignment links deleted' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  @ApiForbiddenResponse({ description: 'User cannot manage the selected class' })
  @ApiNotFoundResponse({ description: 'Exam not found' })
  remove(@Param('id') id: string) {
    return this.examService.remove(+id);
  }
}
