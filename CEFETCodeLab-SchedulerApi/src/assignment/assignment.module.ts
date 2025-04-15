import { Module } from '@nestjs/common';
import { AssignmentService } from './assignment.service';
import { AssignmentController } from './assignment.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Assignment } from './entities/assignment.entity';
import { UserClass } from 'src/user-class/entities/user-class.entity';
import { AssignmentTemplate } from 'src/assignment_template/entities/assignment_template.entity';
import { RequestContextModule } from 'src/request-context/request-context.module';
import { ClassModule } from 'src/class/class.module';

@Module({
  controllers: [AssignmentController],
  imports: [TypeOrmModule.forFeature([Assignment]), TypeOrmModule.forFeature([UserClass]), TypeOrmModule.forFeature([AssignmentTemplate]), RequestContextModule, ClassModule],
  providers: [AssignmentService],
  exports: [AssignmentService],
})
export class AssignmentModule {}
