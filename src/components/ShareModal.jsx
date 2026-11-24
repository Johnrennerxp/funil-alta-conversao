import React, { useState, useEffect } from 'react';
import { 
  X, 
  QrCode, 
  Link2, 
  Mail, 
  MessageCircle, 
  Copy, 
  Check, 
  Download, 
  ExternalLink, 
  Printer, 
  Sparkles,
  Share2,
  Code,
  Send,
  Inbox,
  AlertCircle
} from 'lucide-react';
import QRCode from 'qrcode';

export default function ShareModal({ isOpen, onClose, funnel }) {
  const [activeTab, setActiveTab] = useState('link'); // 'link' | 'qr' | 'email' | 'whatsapp' | 'embed'
  const [emailSubTab, setEmailSubTab] = useState('send'); // 'send' | 'receive'
  const [emailTemplate, setEmailTemplate] = useState('consultoria'); // 'consultoria' | 'rapido' | 'followup'
  
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [customShortInput, setCustomShortInput] = useState('');
  const [loadingShort, setLoadingShort] = useState(false);
  const [shortError, setShortError] = useState('');
  const [copiedType, setCopiedType] = useState(null);

  const slug = funnel?.slug || '';
  const headline = funnel?.design?.headline || 'Formulário de Qualificação';

  // Monta a URL completa do formulário
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const fullUrl = `${origin}${pathname}#/f/${slug}`;
  const effectiveUrl = shortUrl || fullUrl;

  useEffect(() => {
    if (!isOpen || !slug) return;

    // Gera o QR Code em alta resolução
    QRCode.toDataURL(effectiveUrl, {
      width: 600,
      margin: 2,
      color: {
        dark: '#1D1D1F',
        light: '#FFFFFF'
      }
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('Erro ao gerar QR Code:', err));

    setShortError('');
    setCopiedType(null);
  }, [isOpen, slug, effectiveUrl]);

  if (!isOpen || !funnel) return null;

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `qrcode_${slug}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const handlePrintQr = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${headline}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 90vh; text-align: center; color: #1D1D1F; padding: 20px; }
            img { max-width: 320px; height: auto; margin: 20px 0; border: 1px solid #E5E5EA; border-radius: 20px; padding: 12px; }
            h1 { font-size: 22px; margin-bottom: 6px; }
            p { font-size: 13px; color: #86868B; max-width: 360px; line-height: 1.4; }
            .url { font-family: monospace; font-size: 11px; color: #0071E3; margin-top: 10px; word-break: break-all; }
          </style>
        </head>
        <body>
          <h1>${headline}</h1>
          <p>Aponte a câmera do seu celular para escanear e responder ao formulário.</p>
          <img src="${qrDataUrl}" alt="QR Code" />
          <div class="url">${effectiveUrl}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 400);
  };

  // Encurtador de Link Inteligente
  const handleGenerateShortUrl = async () => {
    try {
      setLoadingShort(true);
      setShortError('');

      // Se estiver rodando localmente (localhost ou 127.0.0.1), encurtadores públicos não aceitam IP local.
      // Nesse caso usamos a URL de produção pública correspondente do GitHub Pages.
      let targetUrl = fullUrl;
      const isLocal = typeof window !== 'undefined' && (
        window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.endsWith('.local')
      );
      
      if (isLocal) {
        targetUrl = `https://johnrennerxp.github.io/funil-alta-conversao/#/f/${slug}`;
      }

      // Chamada primária com is.gd (suporta CORS nativo *)
      const res = await fetch(`https://is.gd/create.php?format=json&url=${encodeURIComponent(targetUrl)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.shorturl) {
          setShortUrl(data.shorturl);
          setCustomShortInput(data.shorturl);
          return;
        }
        if (data.errormessage) {
          throw new Error(data.errormessage);
        }
      }
      throw new Error('Falha na resposta do encurtador');
    } catch (err) {
      // Fallback via TinyURL com Proxy CORS
      try {
        let targetUrl = fullUrl;
        if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
          targetUrl = `https://johnrennerxp.github.io/funil-alta-conversao/#/f/${slug}`;
        }
        const res2 = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent('https://tinyurl.com/api-create.php?url=' + encodeURIComponent(targetUrl))}`);
        if (res2.ok) {
          const txt = await res2.text();
          if (txt && txt.startsWith('http')) {
            setShortUrl(txt.trim());
            setCustomShortInput(txt.trim());
            return;
          }
        }
      } catch {}

      // Se ambos falharem por restrição de rede, permite digitar ou encurtar no bitly
      setShortError('Encurtador online bloqueado pela rede/navegador. Você pode colar seu link customizado abaixo ou usar o link direto.');
    } finally {
      setLoadingShort(false);
    }
  };

  // Modelos de E-mail de Envio (Para convidar clientes)
  const getEmailContent = () => {
    if (emailTemplate === 'consultoria') {
      return {
        subject: `Diagnóstico Estratégico Exclusivo: ${headline}`,
        body: `Olá,\n\nPara que possamos preparar uma proposta e um direcionamento personalizado para o seu perfil, preparei este diagnóstico rápido:\n\n🔗 Acesse aqui para preencher: ${effectiveUrl}\n\n⏱️ Leva menos de 60 segundos para responder.\n\nAssim que você concluir, nossa equipe já receberá suas respostas e entraremos em contato direto via WhatsApp para o seu atendimento.\n\nAtenciosamente,\nEquipe Especializada`
      };
    } else if (emailTemplate === 'rapido') {
      return {
        subject: `Acesso ao Formulário: ${headline}`,
        body: `Olá!\n\nSegue o link direto para responder ao nosso questionário:\n\n🔗 ${effectiveUrl}\n\nO preenchimento é rápido e facilitará o alinhamento das próximas etapas.\n\nUm abraço!`
      };
    } else {
      return {
        subject: `Lembrete: Seu formulário está pendente`,
        body: `Olá!\n\nPassando apenas para te lembrar de preencher o formulário para podermos dar sequência ao seu atendimento:\n\n🔗 ${effectiveUrl}\n\nSão poucas perguntas e nos ajudará a entender seu momento atual.\n\nSe tiver qualquer dúvida, responda a este e-mail.\n\nAbraços!`
      };
    }
  };

  const { subject: emailSubject, body: emailBody } = getEmailContent();
  const mailtoHref = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
  const gmailHref = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
  const outlookHref = `https://outlook.live.com/mail/0/deeplink/compose?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

  // Modelo de E-mail de Recebimento (Notificação de Lead para Você/Sua Equipe)
  const receiveEmailSubject = `🎯 [NOVO LEAD QUALIFICADO] - ${headline}`;
  const receiveEmailTemplate = `NOVO LEAD QUALIFICADO RECEBIDO NO FUNIL

📋 Formulário: ${headline}
📅 Data: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
📊 Status: Qualificado (Aprovado nos critérios)

DADOS E RESPOSTAS DO LEAD:
-------------------------------------------
• Pergunta 1: Resposta do lead
• Pergunta 2: Resposta do lead
• Nome & WhatsApp: (Disponível na resposta)

AÇÃO RECOMENDADA:
Chamar o lead no WhatsApp em até 10 minutos para maximizar a conversão.

(Configuração: Cadastre seu e-mail no Editor do Funil > Rastreamento para receber automaticamente.)`;

  const whatsappMessage = `Olá! Preparei este formulário rápido para entender melhor o seu cenário e direcionar seu atendimento:\n\n🔗 ${effectiveUrl}\n\nPreencha em menos de 1 minuto!`;
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;
  const embedCode = `<iframe\n  src="${fullUrl}"\n  width="100%"\n  height="680"\n  style="border:none; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.06);"\n  title="${headline}">\n</iframe>`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-black/[0.06] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Cabeçalho */}
        <div className="p-5 border-b border-black/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center shadow-inner">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1D1D1F]">Compartilhar Formulário</h2>
              <p className="text-[11px] text-[#86868B] truncate max-w-xs">{headline}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/[0.04] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Abas de Navegação Apple Style */}
        <div className="px-5 pt-4 pb-2">
          <div className="flex items-center gap-1 p-1 bg-black/[0.04] rounded-2xl">
            <button
              onClick={() => setActiveTab('link')}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'link'
                  ? 'bg-white text-[#1D1D1F] shadow-sm'
                  : 'text-[#86868B] hover:text-[#1D1D1F]'
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>Link Curto</span>
            </button>
            <button
              onClick={() => setActiveTab('qr')}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'qr'
                  ? 'bg-white text-[#1D1D1F] shadow-sm'
                  : 'text-[#86868B] hover:text-[#1D1D1F]'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>QR Code</span>
            </button>
            <button
              onClick={() => setActiveTab('email')}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'email'
                  ? 'bg-white text-[#1D1D1F] shadow-sm'
                  : 'text-[#86868B] hover:text-[#1D1D1F]'
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-[#0071E3]" />
              <span>E-mail</span>
            </button>
            <button
              onClick={() => setActiveTab('whatsapp')}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'whatsapp'
                  ? 'bg-white text-[#1D1D1F] shadow-sm'
                  : 'text-[#86868B] hover:text-[#1D1D1F]'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={() => setActiveTab('embed')}
              className={`py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                activeTab === 'embed'
                  ? 'bg-white text-[#1D1D1F] shadow-sm'
                  : 'text-[#86868B] hover:text-[#1D1D1F]'
              }`}
              title="Incorporar em site / iframe"
            >
              <Code className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Conteúdo das Abas */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* ABA 1: LINK & ENCURTADOR */}
          {activeTab === 'link' && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#1D1D1F] flex items-center justify-between">
                  <span>Link Direto do Formulário:</span>
                  <a
                    href={fullUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-[#0071E3] hover:underline flex items-center gap-1"
                  >
                    <span>Testar no navegador</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </label>
                <div className="flex items-center gap-2 bg-black/[0.03] p-2 rounded-2xl border border-black/[0.05]">
                  <input
                    type="text"
                    readOnly
                    value={fullUrl}
                    className="bg-transparent text-xs font-mono text-[#1D1D1F] flex-1 outline-none px-2 select-all"
                  />
                  <button
                    onClick={() => handleCopy(fullUrl, 'full')}
                    className="px-3.5 py-1.5 bg-[#0071E3] text-white rounded-xl text-xs font-semibold flex items-center gap-1 hover:bg-[#0077ED] transition-all shrink-0 active:scale-95"
                  >
                    {copiedType === 'full' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedType === 'full' ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

              {/* Bloco Encurtador Inteligente */}
              <div className="p-4 bg-gradient-to-br from-[#0071E3]/[0.05] via-purple-500/[0.03] to-emerald-500/[0.03] border border-[#0071E3]/20 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#0071E3]" />
                    <span className="text-xs font-bold text-[#1D1D1F]">Encurtador de Link Instantâneo</span>
                  </div>
                  <button
                    onClick={handleGenerateShortUrl}
                    disabled={loadingShort}
                    className="px-3.5 py-1.5 bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold rounded-full shadow-sm transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1"
                  >
                    {loadingShort ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Encurtando...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" />
                        <span>Gerar Link Curto</span>
                      </>
                    )}
                  </button>
                </div>

                {shortUrl ? (
                  <div className="space-y-2 animate-fade-in">
                    <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      Link curto criado com sucesso! Ideal para bio do Instagram, TikTok e SMS.
                    </p>
                    <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-emerald-500/30 shadow-sm">
                      <input
                        type="text"
                        readOnly
                        value={shortUrl}
                        className="bg-transparent text-xs font-mono font-bold text-emerald-700 flex-1 outline-none px-2 select-all"
                      />
                      <button
                        onClick={() => handleCopy(shortUrl, 'short')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all shrink-0 active:scale-95"
                      >
                        {copiedType === 'short' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedType === 'short' ? 'Copiado!' : 'Copiar'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[11px] text-[#86868B] leading-relaxed">
                      Clique no botão acima para encurtar seu link automaticamente (ex: <code className="bg-black/[0.05] px-1 py-0.5 rounded text-[#0071E3]">is.gd/xyz</code>).
                    </p>
                    
                    {/* Campo para colar ou digitar um link customizado como bitly */}
                    <div className="pt-1 flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Ou digite seu link customizado (ex: bit.ly/meu-form)"
                        value={customShortInput}
                        onChange={(e) => {
                          setCustomShortInput(e.target.value);
                          setShortUrl(e.target.value);
                        }}
                        className="flex-1 px-3 py-1.5 bg-white rounded-xl text-xs border border-black/[0.08] text-[#1D1D1F] focus:outline-none"
                      />
                      {customShortInput && (
                        <button
                          onClick={() => handleCopy(customShortInput, 'custom')}
                          className="px-3 py-1.5 bg-black/[0.05] hover:bg-black/[0.08] text-[#1D1D1F] rounded-xl text-xs font-semibold flex items-center gap-1"
                        >
                          {copiedType === 'custom' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>Copiar</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {shortError && (
                  <div className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200 flex items-start gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                    <span>{shortError}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ABA 2: QR CODE */}
          {activeTab === 'qr' && (
            <div className="flex flex-col items-center text-center space-y-4 animate-fade-in">
              <div className="p-4 bg-white rounded-3xl border border-black/[0.08] shadow-sm relative group">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="QR Code"
                    className="w-52 h-52 object-contain rounded-2xl"
                  />
                ) : (
                  <div className="w-52 h-52 flex items-center justify-center text-xs text-[#86868B]">
                    Gerando QR Code...
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold text-[#1D1D1F]">
                  Aponte a câmera para abrir instantaneamente
                </p>
                <p className="text-[11px] text-[#86868B] max-w-xs">
                  Ideal para folhetos, cartões, balcões de atendimento, feiras e apresentações.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1 w-full max-w-sm">
                <button
                  onClick={handleDownloadQr}
                  className="flex-1 py-2.5 px-4 bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold rounded-full shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar PNG</span>
                </button>
                <button
                  onClick={handlePrintQr}
                  className="py-2.5 px-4 bg-black/[0.05] hover:bg-black/[0.08] text-[#1D1D1F] text-xs font-semibold rounded-full flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5 text-[#86868B]" />
                  <span>Imprimir</span>
                </button>
              </div>
            </div>
          )}

          {/* ABA 3: E-MAIL (ENVIAR E RECEBER) */}
          {activeTab === 'email' && (
            <div className="space-y-4 animate-fade-in">
              {/* Sub-abas de E-mail: Enviar Convite vs Receber Respostas */}
              <div className="flex items-center gap-1 bg-black/[0.04] p-1 rounded-xl">
                <button
                  onClick={() => setEmailSubTab('send')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    emailSubTab === 'send'
                      ? 'bg-white text-[#1D1D1F] shadow-sm'
                      : 'text-[#86868B] hover:text-[#1D1D1F]'
                  }`}
                >
                  <Send className="w-3.5 h-3.5 text-[#0071E3]" />
                  <span>1. Enviar para Clientes</span>
                </button>
                <button
                  onClick={() => setEmailSubTab('receive')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    emailSubTab === 'receive'
                      ? 'bg-white text-[#1D1D1F] shadow-sm'
                      : 'text-[#86868B] hover:text-[#1D1D1F]'
                  }`}
                >
                  <Inbox className="w-3.5 h-3.5 text-emerald-600" />
                  <span>2. Receber Respostas</span>
                </button>
              </div>

              {/* MODO 1: ENVIAR PARA CLIENTES */}
              {emailSubTab === 'send' && (
                <div className="space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#86868B] uppercase">Selecione o Modelo:</span>
                    <div className="flex items-center gap-1 text-[11px]">
                      <button
                        onClick={() => setEmailTemplate('consultoria')}
                        className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
                          emailTemplate === 'consultoria'
                            ? 'bg-[#0071E3] text-white'
                            : 'bg-black/[0.04] text-[#86868B] hover:text-[#1D1D1F]'
                        }`}
                      >
                        Diagnóstico
                      </button>
                      <button
                        onClick={() => setEmailTemplate('rapido')}
                        className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
                          emailTemplate === 'rapido'
                            ? 'bg-[#0071E3] text-white'
                            : 'bg-black/[0.04] text-[#86868B] hover:text-[#1D1D1F]'
                        }`}
                      >
                        Direto
                      </button>
                      <button
                        onClick={() => setEmailTemplate('followup')}
                        className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
                          emailTemplate === 'followup'
                            ? 'bg-[#0071E3] text-white'
                            : 'bg-black/[0.04] text-[#86868B] hover:text-[#1D1D1F]'
                        }`}
                      >
                        Lembrete
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 bg-black/[0.03] p-3 rounded-2xl border border-black/[0.05]">
                    <div className="border-b border-black/[0.05] pb-1.5">
                      <span className="text-[10px] uppercase font-bold text-[#86868B] block">Assunto:</span>
                      <span className="text-xs font-semibold text-[#1D1D1F]">{emailSubject}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#86868B] block mb-1">Mensagem:</span>
                      <textarea
                        readOnly
                        rows={6}
                        value={emailBody}
                        className="w-full bg-transparent text-xs text-[#1D1D1F] resize-none outline-none leading-relaxed select-all font-sans"
                      />
                    </div>
                  </div>

                  {/* Botões de Ação com 1 clique */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={gmailHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2.5 px-3 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Abrir no Gmail</span>
                      </a>
                      <a
                        href={outlookHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Abrir no Outlook</span>
                      </a>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={mailtoHref}
                        className="flex-1 py-2 px-3 bg-black/[0.04] hover:bg-black/[0.07] text-[#1D1D1F] text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95"
                      >
                        <Mail className="w-3.5 h-3.5 text-[#86868B]" />
                        <span>App Padrão de E-mail</span>
                      </a>
                      <button
                        onClick={() => handleCopy(`${emailSubject}\n\n${emailBody}`, 'email')}
                        className="py-2 px-4 bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
                      >
                        {copiedType === 'email' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedType === 'email' ? 'Copiado!' : 'Copiar Texto'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* MODO 2: RECEBER RESPOSTAS (Notificação) */}
              {emailSubTab === 'receive' && (
                <div className="space-y-3 animate-fade-in">
                  <div className="p-3.5 bg-emerald-500/[0.08] border border-emerald-500/25 rounded-2xl space-y-1.5">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                      <Inbox className="w-4 h-4 text-emerald-600" />
                      <span>Como receber as respostas no seu e-mail:</span>
                    </div>
                    <p className="text-[11px] text-[#1D1D1F] leading-relaxed">
                      Sempre que um lead qualifica, as respostas podem ser enviadas automaticamente para a sua caixa de entrada.
                    </p>
                    <div className="pt-1 text-[11px] text-emerald-900 font-medium space-y-1">
                      <p>1. Vá no <strong>Editor do Funil</strong> &gt; aba <strong>Rastreamento</strong>.</p>
                      <p>2. Preencha o campo <strong>E-mail de Notificação</strong> com o seu e-mail.</p>
                      <p>3. Pronto! A cada resposta você recebe o alerta estruturado abaixo.</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-[#86868B] uppercase block">
                      Exemplo do E-mail que você/sua equipe recebe:
                    </span>
                    <pre className="p-3 bg-black/[0.03] rounded-2xl border border-black/[0.05] text-[11px] font-mono text-[#1D1D1F] whitespace-pre-wrap leading-relaxed">
                      {receiveEmailTemplate}
                    </pre>
                  </div>

                  <button
                    onClick={() => handleCopy(receiveEmailTemplate, 'receive_tpl')}
                    className="w-full py-2.5 px-4 bg-black/[0.05] hover:bg-black/[0.08] text-[#1D1D1F] text-xs font-semibold rounded-full flex items-center justify-center gap-1.5 transition-all active:scale-95"
                  >
                    {copiedType === 'receive_tpl' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#86868B]" />}
                    <span>{copiedType === 'receive_tpl' ? 'Modelo Copiado!' : 'Copiar Modelo de Recebimento'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ABA 4: WHATSAPP */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-1">
                <h3 className="text-xs font-semibold text-[#1D1D1F]">Convite Pré-Formatado para o WhatsApp</h3>
                <p className="text-[11px] text-[#86868B]">
                  Envie diretamente para seus contatos, grupos ou clientes com uma mensagem atrativa.
                </p>
              </div>

              <div className="p-3 bg-emerald-50/60 border border-emerald-500/20 rounded-2xl space-y-2">
                <textarea
                  readOnly
                  rows={4}
                  value={whatsappMessage}
                  className="w-full bg-transparent text-xs text-[#1D1D1F] resize-none outline-none font-sans leading-relaxed select-all"
                />
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 px-4 bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-semibold rounded-full shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>Enviar no WhatsApp</span>
                </a>
                <button
                  onClick={() => handleCopy(whatsappMessage, 'wa')}
                  className="py-2.5 px-4 bg-black/[0.05] hover:bg-black/[0.08] text-[#1D1D1F] text-xs font-semibold rounded-full flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  {copiedType === 'wa' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#86868B]" />}
                  <span>{copiedType === 'wa' ? 'Copiado!' : 'Copiar Texto'}</span>
                </button>
              </div>
            </div>
          )}

          {/* ABA 5: EMBED / IFRAME */}
          {activeTab === 'embed' && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-1">
                <h3 className="text-xs font-semibold text-[#1D1D1F]">Incorporar no seu Site (Iframe)</h3>
                <p className="text-[11px] text-[#86868B]">
                  Cole este código HTML dentro de qualquer página, WordPress, Elementor ou site para exibir o formulário embutido.
                </p>
              </div>

              <pre className="p-3 bg-black/[0.04] rounded-2xl text-[11px] font-mono text-[#1D1D1F] overflow-x-auto whitespace-pre-wrap border border-black/[0.05]">
                {embedCode}
              </pre>

              <button
                onClick={() => handleCopy(embedCode, 'embed')}
                className="w-full py-2.5 px-4 bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold rounded-full shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                {copiedType === 'embed' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedType === 'embed' ? 'Código Copiado!' : 'Copiar Código HTML'}</span>
              </button>
            </div>
          )}

        </div>

        {/* Rodapé com Fechar */}
        <div className="p-3 border-t border-black/[0.06] bg-[#F5F5F7] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-1.5 text-xs font-semibold text-[#86868B] hover:text-[#1D1D1F] transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
}
