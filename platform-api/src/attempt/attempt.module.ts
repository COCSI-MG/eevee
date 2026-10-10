import { Module } from '@nestjs/common';
import { AttemptService } from './attempt.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attempt } from './entities/attempt.entity';
import { AttemptController } from './attempt.controller';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Module({
  providers: [AttemptService, JwtAuthGuard, RolesGuard],
  controllers: [AttemptController],
  imports: [TypeOrmModule.forFeature([Attempt])],
  exports: [AttemptService],
})
export class AttemptModule {}
