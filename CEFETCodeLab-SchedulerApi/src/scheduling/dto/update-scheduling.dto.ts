import { PartialType } from '@nestjs/mapped-types';
import { CreateSchedulingDto } from './create-scheduling.dto';

export class UpdateSchedulingDto extends PartialType(CreateSchedulingDto) {}
