import { ConfigService } from '@nestjs/config';

export const getMailConfig = (configService: ConfigService) => ({
  host: configService.get<string>('SMTP_HOST') || 'smtp.gmail.com',
  port: Number(configService.get<string>('SMTP_PORT') || 587),
  secure: configService.get<string>('SMTP_SECURE') === 'true',
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 20000,
  auth:
    configService.get<string>('SMTP_USER') ||
    configService.get<string>('GMAIL_USER')
      ? {
          user:
            configService.get<string>('SMTP_USER') ||
            configService.get<string>('GMAIL_USER'),
          pass:
            configService.get<string>('SMTP_PASSWORD') ||
            configService.get<string>('GMAIL_APP_PASSWORD'),
        }
      : undefined,
});
