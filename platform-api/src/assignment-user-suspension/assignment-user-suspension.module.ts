import { Module } from '@nestjs/common';
import { AssignmentUserSuspensionService } from './assignment-user-suspension.service';
import { AssignmentUserSuspensionController } from './assignment-user-suspension.controller';
import { AssignmentUserSuspension } from './entities/assignment-user-suspension.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  controllers: [AssignmentUserSuspensionController],
  imports: [TypeOrmModule.forFeature([AssignmentUserSuspension])],
  exports: [AssignmentUserSuspensionService],
  providers: [AssignmentUserSuspensionService],
})
export class AssignmentUserSuspensionModule {}
