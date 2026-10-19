import { ApiProperty } from '@nestjs/swagger';
import { UserListItemResponseDto } from './user-list-item-response.dto';
import { PaginationMetaResponseDto } from 'src/common/dto/pagination-meta-response.dto';

export class PaginatedUsersResponseDto {
  @ApiProperty({ type: [UserListItemResponseDto] })
  data: UserListItemResponseDto[];

  @ApiProperty({ type: PaginationMetaResponseDto })
  meta: PaginationMetaResponseDto;
}
