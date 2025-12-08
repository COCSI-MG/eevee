import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Patch
} from '@nestjs/common';
import { ClassService } from './class.service';
import { CreateOrReplaceClassDto } from './dto/request/create-or-replace-class.dto';
import { ClassResponseDto } from './dto/response/class-response.dto';
import { ApiOkResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { instanceToPlain } from 'class-transformer';
import { AdminGuard } from 'src/auth/guards/admin.guard';

@Controller('class')
@UseGuards(JwtAuthGuard)
export class ClassController {
  constructor(private readonly classService: ClassService) { }

  @Post()
  @UseGuards(AdminGuard)
  @ApiOkResponse({ type: ClassResponseDto })
  create(@Body() createClassDto: CreateOrReplaceClassDto) {
    console.log('createClassDto', createClassDto);
    return this.classService.createOrReplace(createClassDto);
  }

  @Get()
  @ApiOkResponse({ type: [ClassResponseDto] })
  findAll() {
    return this.classService.findAll();
  }

  @Get('user/:userId')
  @ApiOkResponse({ type: [ClassResponseDto] })
  findAllByUser(@Param('userId') userId: string) {
    return instanceToPlain(this.classService.findAllByUser(+userId));
  }

  @Get(':id')
  @ApiOkResponse({ type: ClassResponseDto })
  findOne(@Param('id') id: string) {
    return instanceToPlain(this.classService.findOne(+id));
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id') id: string) {
    return this.classService.remove(+id);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  @ApiOkResponse({ type: ClassResponseDto })
  update(
    @Param('id') id: string,
    @Body() updateClassDto: CreateOrReplaceClassDto,
  ) {
    updateClassDto.id = +id;
    return this.classService.createOrReplace(updateClassDto);
  }
}
