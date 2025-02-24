import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { UserClassService } from './user-class.service';
import { CreateUserClassDto } from './dto/create-user-class.dto';

@Controller('user-class')
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
