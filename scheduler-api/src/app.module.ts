import { join } from 'path';
import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SchedulingModule } from './scheduling/scheduling.module';
import { WorkerModule } from './worker/worker.module';
import { KubernetesModule } from './kubernetes/kubernetes.module';
import { UserModule } from './user/user.module';
import { ClassModule } from './class/class.module';
import { ConfigModule } from '@nestjs/config';
import { UserClassModule } from './user-class/user-class.module';
import { AssignmentModule } from './assignment/assignment.module';
import { PassportModule } from '@nestjs/passport';
import { AttemptModule } from './attempt/attempt.module';
import { AuthModule } from './auth/auth.module';
import { RequestContextModule } from './request-context/request-context.module';
import { ClsModule } from 'nestjs-cls';
import { RequestContextMiddleware } from './request-context/request-context.middleware';
import { TemplateModule } from './template/template.module';
import { AssignmentTemplateModule } from './assignment_template/assignment_template.module';
import { TemplateParamsModule } from './template-params/template-params.module';
import { AssignmentParamsModule } from './assignment_params/assignment_params.module';
import { FileSaverModule } from './file-saver/file-saver.module';
import { ScheduleModule as NestScheduleModule } from '@nestjs/schedule';
import { GithubModule } from './github/github.module';
import { AssignmentUserSuspensionModule } from './assignment-user-suspension/assignment-user-suspension.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Compiled to dist/src/*.js — two levels up is the package root.
      envFilePath: join(__dirname, '..', '..', '.env'),
    }),
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true },
    }),
    DatabaseModule,
    NestScheduleModule.forRoot(),
    RequestContextModule,
    SchedulingModule,
    WorkerModule,
    KubernetesModule,
    AttemptModule,
    UserModule,
    ClassModule,
    UserClassModule,
    AssignmentModule,
    PassportModule,
    AuthModule,
    TemplateModule,
    AssignmentTemplateModule,
    TemplateParamsModule,
    AssignmentParamsModule,
    FileSaverModule,
    GithubModule,
    AssignmentUserSuspensionModule,
  ],
  controllers: [AppController],
  providers: [AppService, RequestContextMiddleware],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestContextMiddleware)
      .exclude(
        {
          path: 'auth/register',
          method: RequestMethod.POST,
        },
        {
          path: 'auth/login',
          method: RequestMethod.POST,
        },
      )
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
