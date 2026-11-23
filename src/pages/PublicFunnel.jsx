import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  AlertCircle, 
  MessageCircle, 
  Lock
} from 'lucide-react';
import { getFunnelBySlug, logAnalyticsEvent, saveFormSubmission } from '../services/firebase';
import { getTrackingParams } from '../utils/utm';
import { trackPixelPageView, trackPixelLead } from '../utils/pixel';
import { buildWhatsAppMessage, buildWhatsAppUrl } from '../utils/whatsapp';

export default function PublicFunnel() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [funnel, setFunnel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [currentStep, setCurrentStep] = useState(0); // 0 = capa, 1..N = perguntas, 998 = desqualificado, 999 = qualificado
  const [answers, setAnswers] = useState({});
  const [textInput, setTextInput] = useState('');
  const [countdown, setCountdown] = useState(3);
  const [redirectUrl, setRedirectUrl] = useState('');

  useEffect(() => {
    loadFunnelData();
  }, [slug]);

  const loadFunnelData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getFunnelBySlug(slug);
      if (!data) {
        setError('Formulário não encontrado ou inativo.');
        setLoading(false);
        return;
      }
      setFunnel(data);

      const tracking = getTrackingParams();
      logAnalyticsEvent(data.id, 'view', tracking);

      if (data.tracking?.pixelId) {
        trackPixelPageView(data.tracking.pixelId);
      }
    } catch (err) {
      setError('Erro ao carregar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && currentStep > 0 && currentStep <= (funnel?.questions?.length || 0)) {
        const q = funnel.questions[currentStep - 1];
        if (q.type === 'short_text') {
          handleTextSubmit();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, textInput, funnel]);

  useEffect(() => {
    const isAutoRedirect = funnel?.whatsapp?.autoRedirect !== false;
    if (currentStep === 999 && redirectUrl && isAutoRedirect) {
      setCountdown(3);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            window.location.href = redirectUrl;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [currentStep, redirectUrl, funnel]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center text-xs text-[#86868B]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-[#0071E3] border-t-transparent rounded-full animate-spin"></div>
          <span>Carregando...</span>
        </div>
      </div>
    );
  }

  if (error || !funnel) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-white rounded-3xl p-8 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-[#1D1D1F]">{error || 'Não encontrado'}</h2>
          <p className="text-xs text-[#86868B]">
            Verifique o link digitado ou acesse o painel.
          </p>
          <button
            onClick={() => navigate('/admin')}
            className="px-4 py-2 bg-[#0071E3] text-white rounded-full text-xs font-semibold shadow-sm"
          >
            Ir para o Painel
          </button>
        </div>
      </div>
    );
  }

  const { design = {}, questions = [], disqualification = {}, tracking = {}, whatsapp = {} } = funnel;
  const totalQuestions = questions.length;
  const currentQIndex = currentStep - 1;
  const currentQuestion = questions[currentQIndex];

  const progressPercent = totalQuestions > 0 && currentStep >= 1 && currentStep <= totalQuestions
    ? Math.round((currentStep / totalQuestions) * 100)
    : 0;

  const customBg = design.backgroundColor || '#F5F5F7';
  const customText = design.textColor || '#1D1D1F';
  const customPrimary = design.primaryColor || '#0071E3';
  const isDark = customBg === '#000000' || customBg.startsWith('#0') || customBg.startsWith('#1');

  const handleStart = () => {
    if (questions.length > 0) {
      setCurrentStep(1);
      setTextInput('');
    }
  };

  const handleSelectOption = (option) => {
    const updatedAnswers = {
      ...answers,
      [currentQuestion.id]: {
        question: currentQuestion.title,
        answer: option.text,
        isQualified: option.isQualified
      }
    };
    setAnswers(updatedAnswers);

    if (option.isQualified === false) {
      setRedirectUrl(''); // Blindagem: zera qualquer URL para nunca redirecionar desqualificados
      const trackingData = getTrackingParams();
      logAnalyticsEvent(funnel.id, 'disqualified', {
        questionId: currentQuestion.id,
        answer: option.text,
        ...trackingData
      });
      // Salva na lista de respostas (Planilha)
      saveFormSubmission(funnel.id, {
        formTitle: design.headline,
        status: 'disqualified',
        answers: Object.values(updatedAnswers),
        tracking: trackingData
      });
      setCurrentStep(998);
      return;
    }

    if (currentStep < totalQuestions) {
      setCurrentStep(currentStep + 1);
      setTextInput('');
    } else {
      finalizePositiveQualification(updatedAnswers);
    }
  };

  const handleTextSubmit = (e) => {
    if (e) e.preventDefault();
    if (!textInput.trim() && currentQuestion?.required) return;

    const updatedAnswers = {
      ...answers,
      [currentQuestion.id]: {
        question: currentQuestion.title,
        answer: textInput.trim(),
        isQualified: true
      }
    };
    setAnswers(updatedAnswers);

    if (currentStep < totalQuestions) {
      setCurrentStep(currentStep + 1);
      setTextInput('');
    } else {
      finalizePositiveQualification(updatedAnswers);
    }
  };

  const finalizePositiveQualification = async (finalAnswers) => {
    setCurrentStep(999);
    const trackingParams = getTrackingParams();

    try {
      import('canvas-confetti').then((m) => {
        const confetti = m.default;
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 }
        });
      }).catch(() => {});
    } catch {
      // Ignora erro de confetti
    }

    logAnalyticsEvent(funnel.id, 'qualified', {
      answers: Object.values(finalAnswers),
      ...trackingParams
    });

    // Salva na lista de respostas (Planilha)
    saveFormSubmission(funnel.id, {
      formTitle: design.headline,
      status: 'qualified',
      answers: Object.values(finalAnswers),
      tracking: trackingParams
    });

    if (tracking.pixelId) {
      trackPixelLead(tracking.pixelId, {
        content_name: design.headline,
        status: 'qualified'
      });
    }

    const answersList = Object.values(finalAnswers);
    const message = buildWhatsAppMessage({
      introText: whatsapp.introText,
      outroText: whatsapp.outroText,
      answers: answersList,
      funnelTitle: design.headline
    });
    const waUrl = buildWhatsAppUrl({ phone: design.whatsappPhone, message });
    setRedirectUrl(waUrl);

    if (tracking.webhookUrl) {
      try {
        fetch(tracking.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'lead_qualified',
            funnelId: funnel.id,
            funnelTitle: design.headline,
            answers: answersList,
            tracking: trackingParams,
            targetWhatsApp: design.whatsappPhone,
            timestamp: new Date().toISOString()
          })
        }).catch(e => console.warn('[Webhook] Falha assíncrona:', e));
      } catch (e) {
        console.warn('[Webhook] Erro:', e);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1 && currentStep <= totalQuestions) {
      setCurrentStep(currentStep - 1);
      const prevQ = questions[currentStep - 2];
      setTextInput(answers[prevQ?.id]?.answer || '');
    } else if (currentStep === 1) {
      setCurrentStep(0);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-between transition-colors duration-200 select-none relative overflow-x-hidden font-sans"
      style={{ backgroundColor: customBg, color: customText }}
    >
      
      {/* Header Superior Limpo */}
      <header className="w-full max-w-xl mx-auto pt-6 px-6 pb-2 z-20">
        <div className="flex items-center justify-between mb-3">
          {currentStep > 0 && currentStep <= totalQuestions ? (
            <button
              onClick={handleBack}
              className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
              title="Voltar"
            >
              <ArrowLeft className="w-4 h-4 opacity-75" />
            </button>
          ) : (
            <div className="w-8"></div>
          )}

          {design.logoUrl ? (
            <img
              src={design.logoUrl}
              alt="Logo"
              className="h-8 max-w-[160px] object-contain"
            />
          ) : (
            <div className="w-8"></div>
          )}

          <div className="w-8 text-right">
            {currentStep >= 1 && currentStep <= totalQuestions && (
              <span className="text-xs font-medium opacity-50 font-mono">
                {currentStep}/{totalQuestions}
              </span>
            )}
          </div>
        </div>

        {/* Barra de Progresso Apple Style */}
        {currentStep >= 1 && currentStep <= totalQuestions && (
          <div className={`w-full h-1 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-black/[0.06]'}`}>
            <div
              className="h-full rounded-full transition-all duration-300 ease-out"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: customPrimary
              }}
            />
          </div>
        )}
      </header>

      {/* Conteúdo Central Principal */}
      <main className="flex-1 max-w-lg w-full mx-auto px-6 py-8 flex flex-col justify-center animate-fade-in z-10">
        
        {/* ETAPA 0: CAPA */}
        {currentStep === 0 && (
          <div className="text-center my-auto space-y-6">
            {design.logoUrl && (
              <div className="flex justify-center mb-1">
                <img
                  src={design.logoUrl}
                  alt="Logo"
                  className="h-14 max-w-[200px] object-contain"
                />
              </div>
            )}

            <div className="space-y-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
                {design.headline || 'Qualificação Estratégica'}
              </h1>
              <p className="text-sm sm:text-base opacity-70 max-w-md mx-auto leading-relaxed">
                {design.subtitle || 'Responda com atenção para direcionarmos seu atendimento.'}
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={handleStart}
                className="w-full sm:w-auto min-w-[220px] py-3.5 px-8 rounded-full font-semibold text-sm tracking-wide shadow-sm hover:shadow transition-all duration-200 active:scale-95 inline-flex items-center justify-center gap-2 group"
                style={{ backgroundColor: customPrimary, color: '#FFFFFF' }}
              >
                <span>Iniciar</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {design.footerText && (
              <p className="text-xs opacity-40 max-w-xs mx-auto leading-normal pt-2">
                {design.footerText}
              </p>
            )}
          </div>
        )}

        {/* ETAPA 1..N: PERGUNTAS */}
        {currentStep >= 1 && currentStep <= totalQuestions && currentQuestion && (
          <div className="my-auto space-y-6 animate-fade-in">
            <div className="space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight leading-snug">
                {currentQuestion.title}
              </h2>
              {currentQuestion.subtitle && (
                <p className="text-xs sm:text-sm opacity-65 leading-relaxed">
                  {currentQuestion.subtitle}
                </p>
              )}
            </div>

            {/* Opções Sem Contorno Rígido */}
            {(currentQuestion.type === 'single_choice' || currentQuestion.type === 'multiple_choice') && (
              <div className="space-y-2.5 pt-1">
                {currentQuestion.options?.map((option, idx) => (
                  <button
                    key={option.id || idx}
                    onClick={() => handleSelectOption(option)}
                    className={`w-full text-left p-4 rounded-2xl transition-all duration-150 flex items-center justify-between group active:scale-[0.99] ${
                      isDark
                        ? 'bg-white/[0.08] hover:bg-white/[0.14]'
                        : 'bg-black/[0.04] hover:bg-black/[0.07]'
                    }`}
                  >
                    <span className="text-sm font-medium pr-3 flex-1">{option.text}</span>
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center transition-colors"
                      style={{
                        backgroundColor: answers[currentQuestion.id]?.answer === option.text ? customPrimary : 'transparent'
                      }}
                    >
                      {answers[currentQuestion.id]?.answer === option.text && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Texto Livre */}
            {currentQuestion.type === 'short_text' && (
              <form onSubmit={handleTextSubmit} className="space-y-3 pt-1">
                <input
                  type="text"
                  autoFocus
                  placeholder={currentQuestion.placeholder || 'Digite sua resposta...'}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  className={`w-full rounded-2xl px-5 py-4 text-sm sm:text-base focus:outline-none transition-all ${
                    isDark ? 'bg-white/10 text-white placeholder:text-white/40' : 'bg-black/[0.04] text-[#1D1D1F] placeholder:text-black/40'
                  }`}
                />
                <button
                  type="submit"
                  disabled={!textInput.trim() && currentQuestion.required}
                  className="w-full py-3.5 px-6 rounded-full text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-40 shadow-sm"
                  style={{ backgroundColor: customPrimary, color: '#FFFFFF' }}
                >
                  <span>Continuar</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        )}

        {/* ETAPA 998: DESQUALIFICADO */}
        {currentStep === 998 && (
          <div className="text-center my-auto space-y-4 animate-fade-in py-6">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                {disqualification.title || 'Agradecemos o seu tempo'}
              </h2>
              <p className="text-xs sm:text-sm opacity-70 max-w-sm mx-auto leading-relaxed">
                {disqualification.message || 'No momento seu perfil não atende aos requisitos desta consultoria.'}
              </p>
            </div>

            <div className="pt-3">
              <button
                onClick={() => {
                  setCurrentStep(0);
                  setAnswers({});
                  setTextInput('');
                }}
                className="text-xs opacity-50 hover:opacity-100 underline transition-opacity"
              >
                Voltar ao início
              </button>
            </div>
          </div>
        )}

        {/* ETAPA 999: QUALIFICADO */}
        {currentStep === 999 && (
          <div className="text-center my-auto space-y-5 animate-fade-in py-6">
            <div className="w-14 h-14 rounded-full bg-emerald-500/15 text-emerald-500 mx-auto flex items-center justify-center">
              <Check className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-500">
                Perfil Aprovado
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Tudo pronto para o seu atendimento
              </h2>
              <p className="text-xs sm:text-sm opacity-70 max-w-sm mx-auto leading-relaxed">
                {funnel?.whatsapp?.autoRedirect !== false ? (
                  <>
                    Abrindo o WhatsApp em <span className="font-bold text-emerald-500 font-mono text-base">{countdown}</span> segundos...
                  </>
                ) : (
                  'Clique no botão abaixo para iniciar seu atendimento exclusivo no WhatsApp.'
                )}
              </p>
            </div>

            <div className="pt-2 space-y-3">
              {/* Aviso Rápido e Direto de Envio no WhatsApp */}
              <div className="max-w-sm mx-auto py-2.5 px-4 rounded-2xl bg-emerald-500/10 text-emerald-800 text-xs font-semibold border border-emerald-500/25 flex items-center justify-center gap-2 animate-pulse">
                <span>📲 Ao entrar no WhatsApp, clique em "Enviar" para iniciar o atendimento!</span>
              </div>

              <a
                href={redirectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto min-w-[260px] py-3.5 px-8 rounded-full font-semibold text-sm tracking-wide shadow-sm hover:shadow transition-all duration-200 active:scale-95 inline-flex items-center justify-center gap-2 text-white"
                style={{ backgroundColor: '#25D366' }}
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>{design.buttonText || 'Abrir WhatsApp Agora'}</span>
              </a>

              <p className="text-[11px] opacity-40">
                Suas respostas foram estruturadas automaticamente.
              </p>
            </div>
          </div>
        )}

      </main>

      {/* Footer Minimalista */}
      <footer className="w-full max-w-xl mx-auto py-4 px-6 text-center text-[11px] opacity-30 z-10 flex items-center justify-center gap-1.5">
        <Lock className="w-3 h-3" />
        <span>Sessão Segura</span>
      </footer>
    </div>
  );
}
