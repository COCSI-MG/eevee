import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from 'src/user/user-role';
import { ClassPerformanceService } from './class-performance.service';
import { ClassIdParamsDto } from './dto/request/class-id-params.dto';
import { ClassPerformanceQueryDto } from './dto/request/class-performance.query.dto';
import { ClassInfosResponseDto } from './dto/response/class-infos-response.dto';
import { ClassPerformanceResponseDto } from './dto/response/class-performance-response.dto';

@Controller('class')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.TEACHER)
export class ClassPerformanceController {
  constructor(private readonly performanceService: ClassPerformanceService) {}

  @Get(':id/infos')
  @ApiOkResponse({ type: ClassInfosResponseDto })
  infos(@Param() { id }: ClassIdParamsDto) {
    return this.performanceService.infos(id);
  }

  @Get(':id/performance')
  @ApiOkResponse({ type: ClassPerformanceResponseDto })
  performance(
    @Param() { id }: ClassIdParamsDto,
    @Query() query: ClassPerformanceQueryDto
  ) {
    return this.performanceService.performance(id, query);
  }
}
