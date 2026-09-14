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
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { instanceToPlain } from 'class-transformer';
import { ListAssignmentsQueryDto } from './dto/list-assignments.query.dto';
import { ListAssignmentOptionsQueryDto } from './dto/list-assignment-options.query.dto';

@Controller('assignment')
@UseGuards(JwtAuthGuard)
export class AssignmentController {
  constructor(private readonly assignmentService: AssignmentService) {}

  @Post()
  @UseGuards(AdminGuard)
  create(@Body() createAssignmentDto: CreateAssignmentDto) {
    return this.assignmentService.create(createAssignmentDto);
  }

  @Get()
  @UseGuards(AdminGuard)
  findAll() {
    return this.assignmentService.findAll();
  }

  @Get('options')
  @UseGuards(AdminGuard)
  findOptions(@Query() query: ListAssignmentOptionsQueryDto) {
    return this.assignmentService.findOptions(query.classId);
  }

  @Get('class/:classId')
  findAssignmentsByClass(@Param('classId') classId: string) {
    return this.assignmentService.findAssignmentsByClass(+classId);
  }

  @Get('me')
  async findAllMyAssignments() {
    const assignments = await this.assignmentService.findAllUserAssignments();
    return instanceToPlain(assignments);
  }

  @Get('paginated')
  @UseGuards(AdminGuard)
  findAllPaginated(@Query() query: ListAssignmentsQueryDto) {
    return this.assignmentService.findAllPaginated(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.assignmentService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  async update(
    @Param('id') id: string,
    @Body() updateAssignmentDto: UpdateAssignmentDto,
  ) {
    return await this.assignmentService.update(+id, updateAssignmentDto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id') id: string) {
    return this.assignmentService.remove(+id);
  }
}
