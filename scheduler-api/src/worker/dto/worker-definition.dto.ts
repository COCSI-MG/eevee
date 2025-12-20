import { IsArray, IsEnum, IsOptional, IsString, Validate, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { MaxDepthConstraint, MaxFilesConstraint } from '../validators/worker-files-node.validators';

export class WorkerFilesNodeDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty({ enum: ['file', 'folder'] })
  @IsEnum(['file', 'folder'])
  type: 'file' | 'folder';

  @ApiProperty({ type: () => [WorkerFilesNodeDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkerFilesNodeDto)
  children: WorkerFilesNodeDto[] | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  content?: string;
}

export class WorkerDefinitionDto {
  @ApiProperty({ type: WorkerFilesNodeDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => WorkerFilesNodeDto)
  @Validate(MaxDepthConstraint, [5])
  @Validate(MaxFilesConstraint, [50])
  files: WorkerFilesNodeDto | null;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  startCommands: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  testCommands: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  dependencies: string[];
}