export function buildPasswordResetEmailHtml(resetUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redefinição de senha</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: 'Geist', Arial, Helvetica, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden;">
          <tr>
            <td style="padding: 40px 32px 0 32px;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #3B82F6;">EEVEE</h1>
              <p style="margin: 4px 0 0 0; font-size: 14px; color: #71717a;">EEVEE Code Lab</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 32px;">
              <h2 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600; color: #18181b;">Redefinição de senha</h2>
              <p style="margin: 0 0 24px 0; font-size: 15px; color: #52525b; line-height: 1.5;">Recebemos uma solicitação de redefinição de senha para sua conta. Clique no botão abaixo para criar uma nova senha.</p>
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr><td style="background-color: #3B82F6; border-radius: 8px;"><a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;">Redefinir senha</a></td></tr>
              </table>
              <p style="margin: 24px 0 0 0; font-size: 13px; color: #71717a; line-height: 1.5;">Se o botão não funcionar, copie e cole o link abaixo no seu navegador:</p>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #3B82F6; word-break: break-all;"><a href="${resetUrl}" target="_blank" style="color: #3B82F6;">${resetUrl}</a></p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 32px 32px 32px;">
              <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 0 0 16px 0;">
              <p style="margin: 0; font-size: 12px; color: #a1a1aa;">Este link expira em <strong style="color: #52525b;">1 hora</strong>. Se você não solicitou esta redefinição, ignore este e-mail.</p>
              <p style="margin: 12px 0 0 0; font-size: 12px; color: #a1a1aa;">&copy; ${new Date().getFullYear()} EEVEE Code Lab</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
