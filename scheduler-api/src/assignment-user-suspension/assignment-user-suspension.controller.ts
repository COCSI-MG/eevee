import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { AssignmentUserSuspensionService } from './assignment-user-suspension.service';
import { CreateAssignmentUserSuspensionDto } from './dto/create-assignment-user-suspension.dto';
import { UpdateAssignmentUserSuspensionDto } from './dto/update-assignment-user-suspension.dto';
import { ClsService } from 'nestjs-cls';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RemoveAssignmentUserSuspensionDto } from './dto/remove-assignment-user-suspension.dto';
import { AdminGuard } from 'src/auth/guards/admin.guard';

@Controller('assignment-user-suspension')
@UseGuards(JwtAuthGuard)
export class AssignmentUserSuspensionController {
  constructor(
    private readonly assignmentUserSuspensionService: AssignmentUserSuspensionService,
    private readonly clsService: ClsService,
  ) {}

  @Post()
  create(
    @Body()
    createAssignmentUserSuspensionDto: CreateAssignmentUserSuspensionDto,
  ) {
    return this.assignmentUserSuspensionService.create(
      createAssignmentUserSuspensionDto,
    );
  }

  @Get('assignment/:assignmentId')
  getSuspensionsByAssignmentId(@Param('assignmentId') assignmentId: string) {
    return this.assignmentUserSuspensionService.getSuspensionsByAssignmentId(
      +assignmentId,
    );
  }

  @Post('suspend')
  suspendUserFromAssignment(
    @Body()
    createAssignmentUserSuspensionDto: CreateAssignmentUserSuspensionDto,
  ) {
    const user = this.clsService.get('user');
    if (!user || !user.userId) {
      throw new Error('User not found in session');
    }
    const { assignmentId, reason } = createAssignmentUserSuspensionDto;
    return this.assignmentUserSuspensionService.suspendUserFromAssignment(
      user.userId,
      assignmentId,
      reason,
    );
  }

  @Post('remove-suspension')
  @UseGuards(AdminGuard)
  removeSuspensionFromAssignment(
    @Body() removeAssignmentUserSuspensionDto: RemoveAssignmentUserSuspensionDto,
  ) {
    return this.assignmentUserSuspensionService.removeSuspensionFromAssignment(
      removeAssignmentUserSuspensionDto.userId,
      removeAssignmentUserSuspensionDto.assignmentId,
    );
  }

  @Get('is-suspended/:assignmentId')
  async isUserSuspendedFromAssignment(
    @Param('assignmentId') assignmentId: string,
  ) {
    const user = this.clsService.get('user');
    const suspended =
      await this.assignmentUserSuspensionService.isUserSuspendedFromAssignment(
        +user.userId,
        +assignmentId,
      );
    if (suspended) {
      return { message: 'User is suspended from this assignment.', suspended: true };
    }
    return { message: 'User is not suspended from this assignment.', suspended: false };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.assignmentUserSuspensionService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body()
    updateAssignmentUserSuspensionDto: UpdateAssignmentUserSuspensionDto,
  ) {
    return this.assignmentUserSuspensionService.update(
      +id,
      updateAssignmentUserSuspensionDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.assignmentUserSuspensionService.remove(+id);
  }
}
