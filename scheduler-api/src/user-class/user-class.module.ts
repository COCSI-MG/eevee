import { Module } from '@nestjs/common';
import { UserClassService } from './user-class.service';
import { UserClassController } from './user-class.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserClass } from './entities/user-class.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserClass])],
  controllers: [UserClassController],
  providers: [UserClassService],
  exports: [UserClassService],
})
export class UserClassModule {}
