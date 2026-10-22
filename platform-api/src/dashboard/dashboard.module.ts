import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Assignment } from 'src/assignment/entities/assignment.entity';
import { Class } from 'src/class/entities/class.entity';
import { User } from 'src/user/entities/user.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Class, Assignment])],
  controllers: [DashboardController],
  providers: [DashboardService, JwtAuthGuard, RolesGuard],
})
export class DashboardModule {}
