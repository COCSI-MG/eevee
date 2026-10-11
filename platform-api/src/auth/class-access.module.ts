import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Assignment } from 'src/assignment/entities/assignment.entity';
import { Class } from 'src/class/entities/class.entity';
import { RequestContextModule } from 'src/request-context/request-context.module';
import { Template } from 'src/template/entities/template.entity';
import { UserClass } from 'src/user-class/entities/user-class.entity';
import { ClassAccessService } from './class-access.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Class, UserClass, Assignment, Template]), RequestContextModule],
  providers: [ClassAccessService],
  exports: [ClassAccessService]
})
export class ClassAccessModule {}
