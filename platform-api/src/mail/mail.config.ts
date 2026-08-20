import { ConfigService } from '@nestjs/config';

export const getMailConfig = (configService: ConfigService) => ({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: configService.get<string>('GMAIL_USER'),
    pass: configService.get<string>('GMAIL_APP_PASSWORD'),
  },
});