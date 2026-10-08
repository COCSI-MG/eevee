import { join } from 'path';
import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SchedulingModule } from './scheduling/scheduling.module';
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
import { AssignmentTemplateModule } from './assignment-template/assignment-template.module';
import { TemplateParamsModule } from './template-params/template-params.module';
import { AssignmentParamsModule } from './assignment-params/assignment-params.module';
import { FileSaverModule } from './file-saver/file-saver.module';
import { ScheduleModule as NestScheduleModule } from '@nestjs/schedule';
import { GithubModule } from './github/github.module';
import { AssignmentAlertModule } from './assignment-alert/assignment-alert.module';
import { DatabaseModule } from './database/database.module';
import { CookieParserMiddleware } from './auth/auth-cookie.middleware';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerBehindProxyGuard } from './auth/guards/throttler-behind-proxy.guard';
import { InterviewResponseModule } from './interview-response/interview-response.module';
import { MailModule } from './mail/mail.module';

import { RealtimeModule } from './realtime/realtime.module';
import { TemplateTestModule } from './template-test/template-test.module';
import { AnswerKeyModule } from './answer-key/answer-key.module';
import { ExamModule } from './exam/exam.module';
import { ExecutionPlatformEventsModule } from './execution/execution-platform-events.module';
import { LearningActivityModule } from './learning-activity/learning-activity.module';
import { InvitationModule } from './invitation/invitation.module';

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
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 300,
        },
      ],
    }),
    DatabaseModule,
    NestScheduleModule.forRoot(),
    RequestContextModule,
    SchedulingModule,
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
    AssignmentAlertModule,
    InterviewResponseModule,
    MailModule,
    RealtimeModule,
    TemplateTestModule,
    AnswerKeyModule,
    ExamModule,
    ExecutionPlatformEventsModule,
    LearningActivityModule,
    InvitationModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    RequestContextMiddleware,
    {
      provide: APP_GUARD,
      useClass: ThrottlerBehindProxyGuard,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CookieParserMiddleware, RequestContextMiddleware)
      .exclude(
        {
          path: 'auth/register',
          method: RequestMethod.POST,
        },
        {
          path: 'auth/login',
          method: RequestMethod.POST,
        },
        {
          path: 'auth/forgot-password',
          method: RequestMethod.POST,
        },
        {
          path: 'auth/reset-password',
          method: RequestMethod.POST,
        },
        {
          path: 'auth/refresh',
          method: RequestMethod.POST,
        },
      )
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
