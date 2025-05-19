import { PartialType } from '@nestjs/swagger';
import { CreateTemplateParamDto } from './create-template_param.dto';

export class UpdateTemplateParamDto extends PartialType(CreateTemplateParamDto) {}
