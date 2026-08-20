import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
  Patch,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/request/create-user.dto';
import { ListUsersQueryDto } from './dto/request/list-users.query.dto';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UserResponseDto } from './dto/response/user-response.dto';
import { PaginatedUsersResponseDto } from './dto/response/paginated-users-response.dto';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { instanceToPlain } from 'class-transformer';
import { UpdateUserDto } from './dto/request/update-user.dto';

@Controller('user')
@UseGuards(AdminGuard)
@ApiTags('User')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOkResponse({ type: UserResponseDto })
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.createOrReplace(createUserDto);
  }

  @Get()
  @ApiOkResponse({ type: [UserResponseDto] })
  findAll() {
    return instanceToPlain(this.userService.findAll());
  }

  @Get('paginated')
  @ApiOkResponse({ type: PaginatedUsersResponseDto })
  async findAllPaginated(@Query() query: ListUsersQueryDto) {
    const result = await this.userService.findAllPaginated(query);
    return instanceToPlain(result);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return instanceToPlain(this.userService.findOne(+id));
  }

  @Patch(':id')
  @ApiOkResponse({ type: UserResponseDto })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
}
