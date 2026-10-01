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
import { ClassService } from './class.service';
import { CreateOrReplaceClassDto } from './dto/request/create-or-replace-class.dto';
import { ClassResponseDto } from './dto/response/class-response.dto';
import { ListClassesQueryDto } from './dto/request/list-classes.query.dto';
import { ApiOkResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { instanceToPlain } from 'class-transformer';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from 'src/user/user-role';

@Controller('class')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassController {
  constructor(private readonly classService: ClassService) { }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOkResponse({ type: ClassResponseDto })
  create(@Body() createClassDto: CreateOrReplaceClassDto) {
    return this.classService.createOrReplace(createClassDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  @ApiOkResponse({ type: [ClassResponseDto] })
  findAll() {
    return this.classService.findAll();
  }

  @Get('options')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  findOptions() {
    return this.classService.findOptions();
  }

  @Get('user/:userId')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  @ApiOkResponse({ type: [ClassResponseDto] })
  findAllByUser(@Param('userId') userId: string) {
    return instanceToPlain(this.classService.findAllByUser(+userId));
  }

  @Get('paginated')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  findAllPaginated(@Query() query: ListClassesQueryDto) {
    return this.classService.findAllPaginated(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  @ApiOkResponse({ type: ClassResponseDto })
  findOne(@Param('id') id: string) {
    return instanceToPlain(this.classService.findOne(+id));
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  remove(@Param('id') id: string) {
    return this.classService.remove(+id);
  }

  @Patch(':id/restore')
  @Roles(UserRole.ADMIN)
  restore(@Param('id') id: string) {
    return this.classService.restore(+id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOkResponse({ type: ClassResponseDto })
  update(
    @Param('id') id: string,
    @Body() updateClassDto: CreateOrReplaceClassDto,
  ) {
    updateClassDto.id = +id;
    return this.classService.createOrReplace(updateClassDto);
  }
}
