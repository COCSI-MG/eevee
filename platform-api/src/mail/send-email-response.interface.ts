export interface SendEmailResponse {
  success: boolean;
  messageId?: string;
  error?: string | Error;
}
