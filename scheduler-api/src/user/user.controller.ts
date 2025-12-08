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
import { UserService } from './user.service';
import { CreateOrUpdateUserDto } from './dto/request/create-or-update-user.dto';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UserResponseDto } from './dto/response/user-response.dto';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { instanceToPlain } from 'class-transformer';

@Controller('user')
@UseGuards(AdminGuard)
@ApiTags('User')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOkResponse({ type: UserResponseDto })
  create(@Body() createUserDto: CreateOrUpdateUserDto) {
    return this.userService.createOrReplace(createUserDto);
  }

  @Get()
  @ApiOkResponse({ type: [UserResponseDto] })
  findAll() {
    return instanceToPlain(this.userService.findAll());
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return instanceToPlain(this.userService.findOne(+id));
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
}
