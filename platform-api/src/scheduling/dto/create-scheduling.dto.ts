import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { CreateWorkerDto } from 'src/worker/dto/create-worker.dto';

export class CreateSchedulingDto extends CreateWorkerDto {
  @ApiProperty()
  @IsNumber()
  @Min(1, { message: 'assignmentId must be greater than zero' })
  assignmentId: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  applicationFileContent: string;

  @ApiProperty({
    required: false,
    type: Object,
    additionalProperties: { type: 'string' },
    example: {
      'src/App.tsx':
        "import React from 'react';\\n\\nexport default function App() {\\n  return <h1>Hello</h1>;\\n}\\n",
    },
  })
  @IsOptional()
  @IsObject()
  files: Record<string, string>;
}
