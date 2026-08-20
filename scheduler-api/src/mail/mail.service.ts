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

    constructor(private configService: ConfigService) {
        const config = getMailConfig(this.configService);
        this.transporter = nodemailer.createTransport(config);
    }

    async sendEmail(params: SendEmailParams): Promise<SendEmailResponse> {
        const { to, subject, text, html, cc, bcc, attachments, replyTo } = params;

        if (!to || !subject || (!text && !html)) {
            const errorMsg = 'Parâmetros inválidos: "to", "subject" e ("text" ou "html") são obrigatórios.';
            this.logger.warn(`Falha na validação de envio de e-mail: ${errorMsg}`);
            return { success: false, error: errorMsg };
        }

        try {
            const info = await this.transporter.sendMail({
                from: this.configService.get<string>('GMAIL_USER'),
                to,
                subject,
                text,
                html,
                cc,
                bcc,
                attachments,
                replyTo,
            });

            this.logger.log(`E-mail enviado com sucesso: Message ID: ${info.messageId}`);

            return { success: true, messageId: info.messageId };
        } catch (error) {
            const errMessage = error instanceof Error ? error.message : typeof error === 'string' ? error : JSON.stringify(error);
            this.logger.error(`Ocorreu um erro ao enviar e-mail. Detalhes: ${errMessage}`);

            return { success: false, error: errMessage };
        }
    }
}
