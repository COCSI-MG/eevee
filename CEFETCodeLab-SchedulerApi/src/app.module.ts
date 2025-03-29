import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SchedulingModule } from './scheduling/scheduling.module';
import { WorkerModule } from './worker/worker.module';
import { KubernetesModule } from './kubernetes/kubernetes.module';
import { TypeOrmModule } from '@nestjs/typeorm';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true },
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.PG_HOST,
      port: Number(process.env.PG_PORT),
      username: process.env.PG_USERNAME,
      password: process.env.PG_PASSWORD,
      database: process.env.PG_DATABASE,
      autoLoadEntities: true,
      synchronize: true,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
    }),
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestContextMiddleware)
      .exclude({
        path: 'auth/register',
        method: RequestMethod.POST,
      }, {
        path: 'auth/login',
        method: RequestMethod.POST,
      })
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
