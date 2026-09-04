import { JwtModule } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { PasswordResetService } from './password-reset.service';
import { AuthController } from './auth.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UserModule } from 'src/user/user.module';
import { MailModule } from 'src/mail/mail.module';
import { RequestContextModule } from 'src/request-context/request-context.module';
import { BullMQModule } from 'src/bullmq/bullmq.module';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PasswordReset } from './entities/password-reset.entity';
import { RefreshSession } from './entities/refresh-session.entity';
import { RefreshSessionService } from './refresh-session.service';
import { SessionCleanupConsumer } from './session-cleanup.processor';
import { User } from 'src/user/entities/user.entity';
import { getAuthSessionTtlSeconds } from './auth-cookie.util';

@Module({
  controllers: [AuthController],
  providers: [AuthService, PasswordResetService, RefreshSessionService, SessionCleanupConsumer, LocalStrategy, JwtStrategy, JwtAuthGuard],
  imports: [
    TypeOrmModule.forFeature([PasswordReset, RefreshSession, User]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: getAuthSessionTtlSeconds(configService) },
      }),
      inject: [ConfigService],
    }),
    UserModule,
    MailModule,
    RequestContextModule,
    BullMQModule,
  ],
})
export class AuthModule {}
