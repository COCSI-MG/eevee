import { Module } from '@nestjs/common';
import { AttemptService } from './attempt.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attempt } from './entities/attempt.entity';

@Module({
  providers: [AttemptService],
  imports: [TypeOrmModule.forFeature([Attempt])],
  exports: [AttemptService],
})
export class AttemptModule {}
