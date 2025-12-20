import { Module } from '@nestjs/common';
import { ClassController } from './class.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Class } from './entities/class.entity';
import { UserClassModule } from 'src/user-class/user-class.module';
import { RequestContextModule } from 'src/request-context/request-context.module';
import { ClassService } from './class.service';

@Module({
  controllers: [ClassController],
  providers: [ClassService],
  imports: [TypeOrmModule.forFeature([Class]), UserClassModule, RequestContextModule],
  exports: [ClassService],
})
export class ClassModule {}
