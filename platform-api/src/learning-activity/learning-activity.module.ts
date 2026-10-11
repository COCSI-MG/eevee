import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestContextModule } from 'src/request-context/request-context.module';
import { LearningActivity } from './entities/learning-activity.entity';
import { LearningQuizAttempt } from './entities/learning-quiz-attempt.entity';
import { LearningActivityController } from './learning-activity.controller';
import { LearningActivityService } from './learning-activity.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([LearningActivity, LearningQuizAttempt]),
    RequestContextModule,
  ],
  controllers: [LearningActivityController],
  providers: [LearningActivityService],
})
export class LearningActivityModule {}
