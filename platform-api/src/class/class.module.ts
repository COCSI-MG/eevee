import { Module } from '@nestjs/common';
import { ClassController } from './class.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Class } from './entities/class.entity';
import { UserClassModule } from 'src/user-class/user-class.module';
import { RequestContextModule } from 'src/request-context/request-context.module';
import { ClassService } from './class.service';
import { User } from 'src/user/entities/user.entity';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Module({
  controllers: [ClassController],
  providers: [ClassService, JwtAuthGuard, RolesGuard],
  imports: [TypeOrmModule.forFeature([Class, User]), UserClassModule, RequestContextModule],
  exports: [ClassService],
})
export class ClassModule {}
