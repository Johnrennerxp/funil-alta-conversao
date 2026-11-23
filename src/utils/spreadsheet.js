/**
 * Utilitário de Exportação para Planilha (CSV / Excel)
 * Inclui UTF-8 BOM (\uFEFF) para compatibilidade nativa com Microsoft Excel no Windows,
 * garantindo que acentos, cedilhas e caracteres em português não fiquem corrompidos.
 */

export function exportSubmissionsToCSV(submissions, funnelTitle = 'Formulario') {
  if (!submissions || submissions.length === 0) {
    alert('Nenhuma resposta registrada neste formulário ainda.');
    return;
  }

  // 1. Coleta todas as perguntas únicas para criar as colunas da planilha
  const questionMap = new Map();
  submissions.forEach(sub => {
    (sub.answers || []).forEach(ans => {
      if (ans.question && !questionMap.has(ans.question)) {
        questionMap.set(ans.question, true);
      }
    });
  });
  const dynamicQuestions = Array.from(questionMap.keys());

  // 2. Monta os cabeçalhos das colunas
  const headers = [
    'Data e Hora',
    'Status do Lead',
    ...dynamicQuestions,
    'Origem (utm_source)',
    'Campanha (utm_campaign)',
    'Mídia (utm_medium)',
    'Conteúdo (utm_content)',
    'Termo (utm_term)',
    'Meta ID (fbclid)',
    'Referrer'
  ];

  // Helper para escapar strings no CSV
  const escapeCSV = (value) => {
    if (value === null || value === undefined) return '""';
    const str = String(value).replace(/"/g, '""');
    return `"${str}"`;
  };

  // 3. Monta as linhas de dados
  const rows = submissions.map(sub => {
    const dateFormatted = sub.submittedAt 
      ? new Date(sub.submittedAt).toLocaleString('pt-BR') 
      : 'Data não informada';
    
    const statusText = sub.status === 'qualified' 
      ? 'QUALIFICADO' 
      : sub.status === 'disqualified' 
        ? 'DESQUALIFICADO' 
        : 'RESPOSTA PARCIAL';

    // Mapeia respostas para cada coluna de pergunta
    const answersObj = {};
    (sub.answers || []).forEach(a => {
      answersObj[a.question] = Array.isArray(a.answer) ? a.answer.join(', ') : a.answer;
    });

    const questionAnswers = dynamicQuestions.map(q => escapeCSV(answersObj[q] || '-'));
    const tracking = sub.tracking || {};

    return [
      escapeCSV(dateFormatted),
      escapeCSV(statusText),
      ...questionAnswers,
      escapeCSV(tracking.utm_source || ''),
      escapeCSV(tracking.utm_campaign || ''),
      escapeCSV(tracking.utm_medium || ''),
      escapeCSV(tracking.utm_content || ''),
      escapeCSV(tracking.utm_term || ''),
      escapeCSV(tracking.fbclid || ''),
      escapeCSV(tracking.referrer || '')
    ].join(';'); // Usando ponto-e-vírgula (padrão Brasil/Excel)
  });

  // 4. Junta tudo com UTF-8 BOM para o Excel abrir direto formatado
  const csvContent = '\uFEFF' + [headers.map(escapeCSV).join(';'), ...rows].join('\r\n');

  // 5. Aciona o download no navegador
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  const cleanTitle = funnelTitle.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 30);
  const today = new Date().toISOString().split('T')[0];
  link.setAttribute('href', url);
  link.setAttribute('download', `planilha-respostas-${cleanTitle}-${today}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
