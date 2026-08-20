export interface SendEmailParams {
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
    cc?: string | string[];
    bcc?: string | string[];
    attachments?: any[];
    replyTo?: string;
}
