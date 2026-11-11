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
import { ClassPerformanceController } from './class-performance.controller';
import { ClassPerformanceService } from './class-performance.service';
import { Assignment } from 'src/assignment/entities/assignment.entity';
import { UserClass } from 'src/user-class/entities/user-class.entity';
import { ClassInvitation } from './entities/class-invitation.entity';

@Module({
  controllers: [ClassController, ClassPerformanceController],
  providers: [ClassService, ClassPerformanceService, JwtAuthGuard, RolesGuard],
  imports: [
    TypeOrmModule.forFeature([
      Class,
      User,
      Assignment,
      UserClass,
      ClassInvitation
    ]),
    UserClassModule,
    RequestContextModule
  ],
  exports: [ClassService],
})
export class ClassModule {}
