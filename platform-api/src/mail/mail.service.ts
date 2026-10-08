import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { getMailConfig } from './mail.config';
import { SendEmailParams } from './send-email-params.interface';
import { SendEmailResponse } from './send-email-response.interface';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport(getMailConfig(configService));
  }

  async sendEmail(params: SendEmailParams): Promise<SendEmailResponse> {
    const { to, subject, text, html, cc, bcc, attachments, replyTo } = params;

    if (!to || !subject || (!text && !html)) {
      const error =
        'Parâmetros inválidos: "to", "subject" e ("text" ou "html") são obrigatórios.';
      this.logger.warn(`Falha na validação de envio de e-mail: ${error}`);
      return { success: false, error };
    }

    try {
      const delivery = await this.transporter.sendMail({
        from:
          this.configService.get<string>('MAIL_FROM') ||
          this.configService.get<string>('GMAIL_USER'),
        to,
        subject,
        text,
        html,
        cc,
        bcc,
        attachments,
        replyTo,
      });

      if (delivery.rejected?.length || !delivery.accepted?.length) {
        return {
          success: false,
          error: 'O servidor de e-mail não aceitou o destinatário.',
        };
      }

      this.logger.log('E-mail enviado com sucesso.');
      return { success: true };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : JSON.stringify(error);
      this.logger.error(
        `Ocorreu um erro ao enviar e-mail. Detalhes: ${message}`,
      );
      return { success: false, error: message };
    }
  }
}
