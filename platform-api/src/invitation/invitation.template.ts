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
  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#312015;padding:32px"><h1>Você foi convidado para a EEVEE</h1><p>Olá, ${escapeHtml(name)}!</p><p>Seu professor convidou você para as seguintes turmas:</p><ul>${classes.map((c) => `<li>${escapeHtml(c)}</li>`).join('')}</ul><p>Pratique os conteúdos, responda aos questionários e acompanhe suas atividades.</p><p style="margin:32px 0"><a href="${escapeHtml(url)}" style="background:#633d18;color:#fff;padding:14px 24px;border-radius:8px;text-decoration:none">Aceitar convite</a></p><p>Crie sua própria senha. Se já possui uma conta, use sua senha atual.</p><p>Este link expira em <strong>7 dias</strong> e só pode ser usado uma vez. Após aceitar, suas turmas aparecerão na plataforma.</p><p>Se o botão não funcionar, copie o endereço:<br>${escapeHtml(url)}</p><p style="font-size:12px">Se não esperava este convite, ignore esta mensagem.</p></div>`;
  return { subject: 'Você foi convidado para a EEVEE', text, html };
}
