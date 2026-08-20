import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class FileUploadDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value))
  assignmentId: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({ type: 'string', format: 'binary' })
  file: any; // This will be handled by multer middleware
}

export class FileDownloadRequestDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value))
  fileEntryId: number;
}

export class FileSyncRequestDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value))
  fileEntryId: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  commitMessage?: string;
}
