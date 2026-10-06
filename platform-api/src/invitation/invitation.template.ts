export const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        char
      ]!,
  );
export function invitationEmail(name: string, classes: string[], url: string) {
  const text = `Olá, ${name}!\n\nVocê recebeu um convite para estudar na EEVEE.\nTurmas: ${classes.join(', ')}.\n\nAceite seu convite: ${url}\n\nO link expira em 7 dias e só pode ser usado uma vez. Crie sua própria senha; se já possui uma conta, use sua senha atual. Após aceitar, suas turmas aparecerão na plataforma.\n\nSe não esperava este convite, ignore esta mensagem.`;
  const safeUrl = escapeHtml(url);
  const html = `<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Seu convite para a EEVEE</title></head>
<body style="margin:0;padding:0;background-color:#f4f1ec;color:#312015;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%">
  <div style="display:none;font-size:1px;line-height:1px;color:#f4f1ec;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all">Seu professor convidou você para a EEVEE. Aceite para acessar suas turmas e começar a praticar.</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f4f1ec">
    <tr><td align="center" style="padding:32px 16px">
      <!--[if mso]><table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0"><tr><td><![endif]-->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px">
        <tr><td bgcolor="#633d18" style="padding:24px 28px;border-radius:16px 16px 0 0">
          <p style="margin:0;font-size:24px;line-height:30px;font-weight:700;letter-spacing:2px;color:#ffffff">&lt;/&gt; EEVEE</p>
          <p style="margin:6px 0 0;font-size:13px;line-height:20px;color:#f3e5d5">Seu espaço para aprender e praticar</p>
        </td></tr>
        <tr><td bgcolor="#ffffff" style="padding:32px 28px;border-left:1px solid #e6ded3;border-right:1px solid #e6ded3">
          <p style="margin:0 0 12px;font-size:12px;line-height:18px;font-weight:700;letter-spacing:1px;color:#805324">CONVITE PARA SUAS TURMAS</p>
          <h1 style="margin:0 0 24px;font-size:28px;line-height:36px;font-weight:700;color:#312015">Sua próxima aula<br>começa aqui.</h1>
          <p style="margin:0 0 12px;font-size:16px;line-height:26px;color:#312015">Olá, ${escapeHtml(name)}!</p>
          <p style="margin:0 0 24px;font-size:16px;line-height:26px;color:#5f5349">Seu professor convidou você para a EEVEE. Aqui você pode praticar os conteúdos das aulas, responder aos questionários e acompanhar suas atividades.</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f8f5f0" style="border:1px solid #e6ded3;border-radius:8px">
            <tr><td style="padding:20px">
              <p style="margin:0 0 12px;font-size:12px;line-height:18px;font-weight:700;letter-spacing:1px;color:#756454">${classes.length === 1 ? 'SUA TURMA' : 'SUAS TURMAS'}</p>
              ${classes.map((c) => `<p style="margin:0;padding:6px 0;font-size:16px;line-height:24px;font-weight:700;color:#312015;overflow-wrap:anywhere">${escapeHtml(c)}</p>`).join('')}
            </td></tr>
          </table>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:28px 0 16px">
            <tr><td align="center" bgcolor="#633d18" style="border-radius:8px;mso-padding-alt:16px 28px">
              <a href="${safeUrl}" style="display:inline-block;padding:16px 28px;border:1px solid #633d18;border-radius:8px;font-size:16px;line-height:22px;font-weight:700;font-family:Arial,Helvetica,sans-serif;text-decoration:none;color:#ffffff;background-color:#633d18;mso-padding-alt:0"><!--[if mso]><i style="mso-font-width:200%;mso-text-raise:24pt" hidden>&emsp;</i><span style="mso-text-raise:12pt"><![endif]-->Aceitar meu convite<!--[if mso]></span><i style="mso-font-width:200%" hidden>&emsp;&#8203;</i><![endif]--></a>
            </td></tr>
          </table>
          <p style="margin:0 0 28px;font-size:13px;line-height:20px;color:#756454">Convite válido por <strong>7 dias</strong>, para um único uso.</p>
          <p style="margin:0 0 8px;font-size:15px;line-height:24px;font-weight:700;color:#312015">Como começar</p>
          <p style="margin:0;font-size:14px;line-height:24px;color:#5f5349">Ao aceitar, crie sua própria senha. Se já tem uma conta na EEVEE, use sua senha atual. Suas turmas aparecerão na plataforma assim que concluir.</p>
        </td></tr>
        <tr><td bgcolor="#faf8f5" style="padding:24px 28px;border:1px solid #e6ded3;border-radius:0 0 16px 16px">
          <p style="margin:0 0 8px;font-size:12px;line-height:20px;color:#756454">O botão não abriu? Copie este link e cole no navegador:</p>
          <p style="margin:0;font-size:12px;line-height:20px;word-break:break-all;overflow-wrap:anywhere"><a href="${safeUrl}" style="color:#633d18;text-decoration:underline;word-break:break-all">${safeUrl}</a></p>
        </td></tr>
        <tr><td align="center" style="padding:24px 16px">
          <p style="margin:0;font-size:12px;line-height:20px;color:#756454">EEVEE · Aprender fazendo.</p>
          <p style="margin:8px 0 0;font-size:12px;line-height:20px;color:#756454">Se não esperava este convite, você pode ignorar esta mensagem.</p>
        </td></tr>
      </table>
      <!--[if mso]></td></tr></table><![endif]-->
    </td></tr>
  </table>
</body>
</html>`;
  return { subject: 'Você foi convidado para a EEVEE', text, html };
}
