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
  Code
} from 'lucide-react';
import QRCode from 'qrcode';

export default function ShareModal({ isOpen, onClose, funnel }) {
  const [activeTab, setActiveTab] = useState('qr'); // 'qr' | 'link' | 'email' | 'whatsapp' | 'embed'
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [shortUrl, setShortUrl] = useState('');
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
    QRCode.toDataURL(fullUrl, {
      width: 600,
      margin: 2,
      color: {
        dark: '#1D1D1F',
        light: '#FFFFFF'
      }
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('Erro ao gerar QR Code:', err));

    // Reset de estados
    setShortUrl('');
    setShortError('');
    setCopiedType(null);
  }, [isOpen, slug, fullUrl]);

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

  const handleGenerateShortUrl = async () => {
    if (shortUrl) return;
    try {
      setLoadingShort(true);
      setShortError('');
      
      const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(fullUrl)}`);
      if (res.ok) {
        const text = await res.text();
        if (text && text.startsWith('http')) {
          setShortUrl(text.trim());
          return;
        }
      }
      throw new Error('Falha no encurtador');
    } catch {
      // Fallback: se a API externa bloquear CORS ou falhar, mantém o link limpo
      setShortUrl(fullUrl);
      setShortError('Usando link direto (TinyURL indisponível no momento).');
    } finally {
      setLoadingShort(false);
    }
  };

  // Textos prontos para e-mail e WhatsApp
  const emailSubject = `Convite: ${headline}`;
  const emailBody = `Olá!\n\nGostaria de te convidar para responder a este formulário rápido:\n\n🔗 Acesse aqui: ${effectiveUrl}\n\nLeva menos de 1 minuto e nos ajudará a entender melhor o seu perfil para o atendimento.\n\nAtenciosamente.`;
  const mailtoHref = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

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
          
          {/* ABA 1: QR CODE */}
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

          {/* ABA 2: LINK & ENCURTADOR */}
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
                    className="px-3 py-1.5 bg-[#0071E3] text-white rounded-xl text-xs font-semibold flex items-center gap-1 hover:bg-[#0077ED] transition-all shrink-0 active:scale-95"
                  >
                    {copiedType === 'full' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedType === 'full' ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

              {/* Bloco Encurtador */}
              <div className="p-4 bg-gradient-to-br from-[#0071E3]/[0.04] to-purple-500/[0.04] border border-[#0071E3]/20 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#0071E3]" />
                    <span className="text-xs font-bold text-[#1D1D1F]">Encurtador de Link Instantâneo</span>
                  </div>
                  {!shortUrl && (
                    <button
                      onClick={handleGenerateShortUrl}
                      disabled={loadingShort}
                      className="px-3 py-1 bg-white hover:bg-black/[0.02] border border-black/[0.08] text-[#0071E3] text-xs font-semibold rounded-full shadow-sm transition-all active:scale-95 disabled:opacity-50"
                    >
                      {loadingShort ? 'Encurtando...' : 'Gerar Link Curto'}
                    </button>
                  )}
                </div>

                {shortUrl ? (
                  <div className="space-y-1.5">
                    <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Link curto pronto para bio, stories ou SMS!
                    </p>
                    <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-black/[0.08] shadow-sm">
                      <input
                        type="text"
                        readOnly
                        value={shortUrl}
                        className="bg-transparent text-xs font-mono font-semibold text-[#0071E3] flex-1 outline-none px-2 select-all"
                      />
                      <button
                        onClick={() => handleCopy(shortUrl, 'short')}
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-emerald-700 transition-all shrink-0 active:scale-95"
                      >
                        {copiedType === 'short' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedType === 'short' ? 'Copiado' : 'Copiar'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-[#86868B]">
                    Gera um link limpo e compacto (ex: tinyurl.com/...), perfeito para colocar na bio do Instagram, disparos de SMS ou WhatsApp.
                  </p>
                )}

                {shortError && (
                  <p className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded-lg">{shortError}</p>
                )}
              </div>
            </div>
          )}

          {/* ABA 3: WHATSAPP */}
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

          {/* ABA 4: E-MAIL */}
          {activeTab === 'email' && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-1">
                <h3 className="text-xs font-semibold text-[#1D1D1F]">Convite por E-mail</h3>
                <p className="text-[11px] text-[#86868B]">
                  Dispare para seus leads ou clientes com o link do questionário pronto para ser aberto.
                </p>
              </div>

              <div className="space-y-2 bg-black/[0.03] p-3 rounded-2xl border border-black/[0.05]">
                <div className="border-b border-black/[0.05] pb-2">
                  <span className="text-[10px] uppercase font-bold text-[#86868B] block">Assunto:</span>
                  <span className="text-xs font-semibold text-[#1D1D1F]">{emailSubject}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#86868B] block mb-1">Corpo:</span>
                  <textarea
                    readOnly
                    rows={5}
                    value={emailBody}
                    className="w-full bg-transparent text-xs text-[#1D1D1F] resize-none outline-none leading-relaxed select-all"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={mailtoHref}
                  className="flex-1 py-2.5 px-4 bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold rounded-full shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  <Mail className="w-4 h-4" />
                  <span>Abrir no seu App de E-mail</span>
                </a>
                <button
                  onClick={() => handleCopy(`${emailSubject}\n\n${emailBody}`, 'email')}
                  className="py-2.5 px-4 bg-black/[0.05] hover:bg-black/[0.08] text-[#1D1D1F] text-xs font-semibold rounded-full flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  {copiedType === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#86868B]" />}
                  <span>{copiedType === 'email' ? 'Copiado!' : 'Copiar Texto'}</span>
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
