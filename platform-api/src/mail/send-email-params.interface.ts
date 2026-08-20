import type * as nodemailer from 'nodemailer';

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: nodemailer.SendMailOptions['attachments'];
  replyTo?: string;
}
