import { PartialType } from '@nestjs/mapped-types';
import { CreateUserClassDto } from './create-user-class.dto';

export class UpdateUserClassDto extends PartialType(CreateUserClassDto) {}
