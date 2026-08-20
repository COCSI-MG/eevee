import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaResponseDto {
  @ApiProperty({ example: 23 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  pageSize: number;

  @ApiProperty({ example: 3 })
  totalPages: number;
}
