import { Module } from '@nestjs/common';
import { AssignmentService } from './assignment.service';
import { AssignmentController } from './assignment.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Assignment } from './entities/assignment.entity';
import { RequestContextModule } from 'src/request-context/request-context.module';

@Module({
  controllers: [AssignmentController],
  imports: [TypeOrmModule.forFeature([Assignment]), RequestContextModule],
  providers: [AssignmentService],
  exports: [AssignmentService],
})
export class AssignmentModule {}
