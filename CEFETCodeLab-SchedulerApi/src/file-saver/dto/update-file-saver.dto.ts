import { PartialType } from '@nestjs/swagger';
import { CreateFileEntryDto, CreateGitRepositoryDto } from './create-file-entry.dto';

export class UpdateFileEntryDto extends PartialType(CreateFileEntryDto) {}

export class UpdateGitRepositoryDto extends PartialType(CreateGitRepositoryDto) {}
