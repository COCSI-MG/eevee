import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Put,
  Patch,
} from '@nestjs/common';
import { AssignmentService } from './assignment.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { instanceToPlain } from 'class-transformer';

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

  @Get('class/:classId')
  findAssignmentsByClass(@Param('classId') classId: string) {
    return this.assignmentService.findAssignmentsByClass(+classId);
  }

  @Get('me')
  async findAllMyAssignments() {
    const assignments = await this.assignmentService.findAllUserAssignments();
    return instanceToPlain(assignments);
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
