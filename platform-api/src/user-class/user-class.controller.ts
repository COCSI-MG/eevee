import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { UserClassService } from './user-class.service';
import { CreateUserClassDto } from './dto/create-user-class.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from 'src/user/user-role';

@Controller('user-class')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class UserClassController {
  constructor(private readonly userClassService: UserClassService) {}

  @Post()
  create(@Body() createUserClassDto: CreateUserClassDto[]) {
    return this.userClassService.createMany(createUserClassDto);
  }

  @Get()
  findAll() {
    return this.userClassService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userClassService.findOne(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userClassService.remove(+id);
  }
}
