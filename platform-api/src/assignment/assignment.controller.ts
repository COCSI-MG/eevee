import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Patch,
  Query,
} from '@nestjs/common';
import { AssignmentService } from './assignment.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from 'src/user/user-role';
import { instanceToPlain } from 'class-transformer';
import { ListAssignmentsQueryDto } from './dto/list-assignments.query.dto';
import { ListAssignmentOptionsQueryDto } from './dto/list-assignment-options.query.dto';

@Controller('assignment')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssignmentController {
  constructor(private readonly assignmentService: AssignmentService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  create(@Body() createAssignmentDto: CreateAssignmentDto) {
    return this.assignmentService.create(createAssignmentDto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.assignmentService.findAll();
  }

  @Get('options')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  findOptions(@Query() query: ListAssignmentOptionsQueryDto) {
    return this.assignmentService.findOptions(query.classId);
  }

  @Get('class/:classId')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  findAssignmentsByClass(@Param('classId') classId: string) {
    return this.assignmentService.findAssignmentsByClass(+classId);
  }

  @Get('me')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  async findAllMyAssignments() {
    const assignments = await this.assignmentService.findAllUserAssignments();
    return instanceToPlain(assignments);
  }

  @Get('paginated')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  findAllPaginated(@Query() query: ListAssignmentsQueryDto) {
    return this.assignmentService.findAllPaginated(query);
  }

  @Get(':id/import-sources')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  findImportSources(@Param('id') id: string) {
    return this.assignmentService.findImportSources(+id)
  }

  @Get(':id/import-sources/:sourceId')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  findImportSource(
    @Param('id') id: string,
    @Param('sourceId') sourceId: string
  ) {
    return this.assignmentService.findImportSource(+id, +sourceId)
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  findOne(@Param('id') id: string) {
    return this.assignmentService.findOne(+id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  async update(
    @Param('id') id: string,
    @Body() updateAssignmentDto: UpdateAssignmentDto,
  ) {
    return await this.assignmentService.update(+id, updateAssignmentDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  remove(@Param('id') id: string) {
    return this.assignmentService.remove(+id);
  }
}
