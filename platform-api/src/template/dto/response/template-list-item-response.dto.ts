import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkerType } from 'src/worker/enum/worker-type.enum';

export class TemplateListItemResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Template de teste' })
  title: string;

  @ApiPropertyOptional({ example: 'Descrição do template' })
  description?: string;

  @ApiProperty({ enum: Object.values(WorkerType) })
  workerType: WorkerType;
}
