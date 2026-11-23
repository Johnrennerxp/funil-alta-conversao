/**
 * Motor de síntese e formatação de mensagens estruturadas para WhatsApp
 * Gera links universais `https://wa.me/NUMERO?text=...` com introdução,
 * respostas estruturadas em tópicos legíveis e encerramento personalizado.
 */

export function sanitizePhone(rawPhone) {
  if (!rawPhone) return '';
  // Remove parênteses, traços, espaços e caracteres não numéricos
  return rawPhone.replace(/\D/g, '');
}

export function buildWhatsAppMessage({
  introText = 'Olá! Acabei de responder o formulário de qualificação:',
  outroText = 'Gostaria de dar continuidade ao atendimento. Como podemos prosseguir?',
  answers = [],
  funnelTitle = ''
}) {
  const lines = [];

  if (funnelTitle) {
    lines.push(`📋 *${funnelTitle}*`);
    lines.push('');
  }

  if (introText) {
    lines.push(introText);
    lines.push('');
  }

  lines.push('━━━━━━━━━━━━━━━');

  answers.forEach((item, index) => {
    const questionNum = index + 1;
    const answerText = Array.isArray(item.answer)
      ? item.answer.join(', ')
      : item.answer || 'Não informado';

    lines.push(`*${questionNum}. ${item.question}*`);
    lines.push(`👉 ${answerText}`);
    lines.push('');
  });

  lines.push('━━━━━━━━━━━━━━━');

  if (outroText) {
    lines.push('');
    lines.push(outroText);
  }

  return lines.join('\n');
}

export function buildWhatsAppUrl({ phone, message }) {
  const cleanPhone = sanitizePhone(phone);
  if (!cleanPhone) return '#';
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}
