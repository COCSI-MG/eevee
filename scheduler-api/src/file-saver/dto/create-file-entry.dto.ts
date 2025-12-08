import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateFileEntryDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  assignmentId: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  filePath: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  fileSize: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  localTempPath?: string;
}

export class CreateGitRepositoryDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  assignmentId: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  repositoryName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  repositoryUrl: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  localPath: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  defaultBranch?: string;
}
