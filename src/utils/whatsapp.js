/**
 * Motor de formatação limpa e humana de mensagens para WhatsApp
 * Gera mensagens sem linhas robóticas ou caracteres que quebram em navegadores.
 */

export function sanitizePhone(rawPhone) {
  if (!rawPhone) return '';
  return rawPhone.replace(/\D/g, '');
}

export function buildWhatsAppMessage({
  introText = 'Olá! Concluí as perguntas:',
  outroText = 'Podemos dar sequência ao atendimento?',
  answers = [],
  funnelTitle = ''
}) {
  const lines = [];

  const intro = introText || 'Olá! Concluí as perguntas:';
  lines.push(intro);
  lines.push('');

  answers.forEach((item) => {
    const answerText = Array.isArray(item.answer)
      ? item.answer.join(', ')
      : item.answer || '';

    if (answerText) {
      lines.push(`*${item.question}*`);
      lines.push(answerText);
      lines.push('');
    }
  });

  if (outroText) {
    lines.push(outroText);
  }

  return lines.join('\n').trim();
}

export function buildWhatsAppUrl({ phone, message }) {
  const cleanPhone = sanitizePhone(phone);
  if (!cleanPhone) return '#';
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}
