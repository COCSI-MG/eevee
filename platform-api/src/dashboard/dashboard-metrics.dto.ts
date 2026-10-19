import { ApiProperty } from '@nestjs/swagger';

export class DashboardMetricsDto {
  @ApiProperty({ description: 'Total de usuários ativos' })
  usersCount: number;

  @ApiProperty({ description: 'Total de turmas ativas' })
  classesCount: number;

  @ApiProperty({ description: 'Total de atividades' })
  assignmentsCount: number;
}
