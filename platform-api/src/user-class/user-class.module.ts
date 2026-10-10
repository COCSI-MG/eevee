import { Module } from '@nestjs/common';
import { UserClassService } from './user-class.service';
import { UserClassController } from './user-class.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserClass } from './entities/user-class.entity';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([UserClass])],
  controllers: [UserClassController],
  providers: [UserClassService, JwtAuthGuard, RolesGuard],
  exports: [UserClassService],
})
export class UserClassModule {}
