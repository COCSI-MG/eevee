import { IsArray, IsObject, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class WorkerDefinitionDto {
  @ApiProperty({
    type: Object,
    required: false,
    additionalProperties: { type: 'string' },
  })
  @IsOptional()
  @IsObject()
  files: Record<string, string> | null;

  @ApiProperty({
    type: Object,
    required: false,
    additionalProperties: { type: 'string' },
  })
  @IsOptional()
  @IsObject()
  testFiles: Record<string, string> | null;

  @ApiProperty({ type: String, example: '/app/workspace/src' })
  @IsString()
  srcPath: string;

  @ApiProperty({ type: String, example: '/app/workspace/test' })
  @IsString()
  testPath: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  dependencies: string[];
}