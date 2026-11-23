import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  AlertCircle, 
  MessageCircle, 
  RotateCcw,
  Smartphone,
  Tablet,
  Monitor
} from 'lucide-react';
import { buildWhatsAppMessage, buildWhatsAppUrl } from '../utils/whatsapp';

export default function MobileSimulator({ funnel }) {
  const [deviceMode, setDeviceMode] = useState('mobile'); // 'mobile' | 'tablet' | 'desktop'
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [textInput, setTextInput] = useState('');
  const [countdown, setCountdown] = useState(3);

  if (!funnel) {
    return (
      <div className="w-full h-full flex items-center justify-center text-[#86868B] text-xs">
        Nenhum funil carregado
      </div>
    );
  }

  const { design = {}, questions = [], disqualification = {}, whatsapp = {} } = funnel;
  const isAutoRedirect = whatsapp.autoRedirect !== false;
  const totalQuestions = questions.length;
  const currentQIndex = currentStep - 1;
  const currentQuestion = questions[currentQIndex];

  const progressPercent = totalQuestions > 0 && currentStep >= 1 && currentStep <= totalQuestions
    ? Math.round((currentStep / totalQuestions) * 100)
    : 0;

  useEffect(() => {
    if (currentStep === 999 && isAutoRedirect) {
      setCountdown(3);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [currentStep, isAutoRedirect]);

  const handleStart = () => {
    if (questions.length > 0) {
      setCurrentStep(1);
      setTextInput('');
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setAnswers({});
    setTextInput('');
    setCountdown(3);
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
      setCurrentStep(998);
      return;
    }

    if (currentStep < totalQuestions) {
      setCurrentStep(currentStep + 1);
      setTextInput('');
    } else {
      setCurrentStep(999);
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
      setCurrentStep(999);
    }
  };

  const handleBack = () => {
    if (currentStep > 1 && currentStep <= totalQuestions) {
      setCurrentStep(currentStep - 1);
      const prevQ = questions[currentStep - 2];
      setTextInput(answers[prevQ?.id]?.answer || '');
    } else if (currentStep === 1) {
      setCurrentStep(0);
    } else if (currentStep >= 998) {
      setCurrentStep(totalQuestions);
    }
  };

  const formattedAnswersList = Object.values(answers);
  const waMessage = buildWhatsAppMessage({
    introText: whatsapp.introText,
    outroText: whatsapp.outroText,
    answers: formattedAnswersList,
    funnelTitle: design.headline
  });
  const waUrl = buildWhatsAppUrl({ phone: design.whatsappPhone, message: waMessage });

  const customBg = design.backgroundColor || '#FFFFFF';
  const customText = design.textColor || '#1D1D1F';
  const customPrimary = design.primaryColor || '#0071E3';

  // Verifica se o tema é escuro para ajustar contrastes internos
  const isDark = customBg === '#000000' || customBg.startsWith('#0') || customBg.startsWith('#1');

  // Configurações de dimensão e moldura por dispositivo
  const deviceStyles = {
    mobile: {
      container: 'w-[340px] h-[670px] rounded-[48px] p-3 bg-[#000000]',
      screen: 'rounded-[38px]',
      island: true,
      browserBar: false,
      homeBar: true
    },
    tablet: {
      container: 'w-[480px] max-w-full h-[650px] rounded-[36px] p-3.5 bg-[#1C1C1E]',
      screen: 'rounded-[26px]',
      island: false,
      tabletBezel: true,
      browserBar: false,
      homeBar: true
    },
    desktop: {
      container: 'w-[580px] max-w-full h-[520px] rounded-[18px] p-0 bg-[#E5E5EA] border border-black/10 overflow-hidden',
      screen: 'rounded-b-[18px]',
      island: false,
      browserBar: true,
      homeBar: false
    }
  };

  const currentDev = deviceStyles[deviceMode];

  return (
    <div className="flex flex-col items-center w-full">
      
      {/* Controles do Simulador: Seletor de Aparelho & Reiniciar */}
      <div className="w-full max-w-[580px] flex items-center justify-between mb-3 px-1">
        {/* Seletor Segmentado Apple Style de Dispositivo */}
        <div className="flex items-center apple-segmented-bg p-0.5">
          <button
            type="button"
            onClick={() => setDeviceMode('mobile')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs apple-segmented-item ${
              deviceMode === 'mobile' ? 'apple-segmented-item-active' : 'text-[#86868B] hover:text-[#1D1D1F]'
            }`}
            title="Visualização Celular"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Celular</span>
          </button>

          <button
            type="button"
            onClick={() => setDeviceMode('tablet')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs apple-segmented-item ${
              deviceMode === 'tablet' ? 'apple-segmented-item-active' : 'text-[#86868B] hover:text-[#1D1D1F]'
            }`}
            title="Visualização Tablet"
          >
            <Tablet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tablet</span>
          </button>

          <button
            type="button"
            onClick={() => setDeviceMode('desktop')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs apple-segmented-item ${
              deviceMode === 'desktop' ? 'apple-segmented-item-active' : 'text-[#86868B] hover:text-[#1D1D1F]'
            }`}
            title="Visualização PC / Desktop"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">PC</span>
          </button>
        </div>

        <button
          onClick={handleReset}
          className="inline-flex items-center gap-1 text-[11px] text-[#86868B] hover:text-[#1D1D1F] bg-white px-2.5 py-1 rounded-full shadow-sm transition-colors"
          title="Reiniciar Simulação"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reiniciar</span>
        </button>
      </div>

      {/* Frame de Simulação com Apple Design System */}
      <div className={`relative ${currentDev.container} shadow-[0_24px_50px_rgba(0,0,0,0.18)] flex flex-col transition-all duration-300`}>
        
        {/* Dynamic Island (Apenas Celular) */}
        {currentDev.island && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-5 bg-[#000000] rounded-full z-30 flex items-center justify-between px-3">
            <div className="w-2 h-2 rounded-full bg-white/[0.08]"></div>
            <div className="w-2 h-2 rounded-full bg-blue-900/40"></div>
          </div>
        )}

        {/* Câmera Tablet Bezel */}
        {currentDev.tabletBezel && (
          <div className="w-full flex items-center justify-center pb-1">
            <div className="w-2 h-2 rounded-full bg-black/40"></div>
          </div>
        )}

        {/* Browser Top Bar (Modo PC / Desktop) */}
        {currentDev.browserBar && (
          <div className="h-8 bg-[#E5E5EA] px-3 flex items-center gap-2 border-b border-black/[0.06] select-none">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]"></div>
            </div>
            <div className="flex-1 max-w-xs mx-auto bg-white/80 rounded-md py-0.5 px-3 text-[10px] text-center text-[#86868B] font-mono truncate">
              {funnel.slug ? `https://seusite.com/#/f/${funnel.slug}` : 'https://seusite.com/#/f/preview'}
            </div>
          </div>
        )}

        {/* Tela Interna Renderizada */}
        <div
          className={`relative w-full h-full ${currentDev.screen} overflow-hidden flex flex-col justify-between transition-colors duration-200`}
          style={{ backgroundColor: customBg, color: customText }}
        >
          
          {/* Top Bar Interna */}
          <div className="pt-5 px-4 pb-2 flex items-center justify-between z-20">
            {currentStep > 0 && currentStep <= totalQuestions ? (
              <button
                onClick={handleBack}
                className={`p-1.5 rounded-full transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
                style={{ color: customText }}
                title="Voltar"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <div className="w-6"></div>
            )}

            {design.logoUrl ? (
              <img
                src={design.logoUrl}
                alt="Logo"
                className="h-6 max-w-[120px] object-contain"
              />
            ) : (
              <div className="w-6"></div>
            )}

            <div className="w-6 text-right">
              {currentStep >= 1 && currentStep <= totalQuestions && (
                <span className="text-[10px] font-medium opacity-50">
                  {currentStep}/{totalQuestions}
                </span>
              )}
            </div>
          </div>

          {/* Barra de Progresso Minimalista */}
          {currentStep >= 1 && currentStep <= totalQuestions && (
            <div className={`w-full h-1 ${isDark ? 'bg-white/10' : 'bg-black/[0.06]'}`}>
              <div
                className="h-1 transition-all duration-300 ease-out"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: customPrimary
                }}
              />
            </div>
          )}

          {/* Conteúdo Central */}
          <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col justify-center animate-fade-in">
            
            {/* ETAPA 0: CAPA */}
            {currentStep === 0 && (
              <div className="text-center my-auto space-y-4 max-w-md mx-auto">
                {design.logoUrl && (
                  <div className="mb-2 flex justify-center">
                    <img
                      src={design.logoUrl}
                      alt="Logo"
                      className="h-10 max-w-[150px] object-contain"
                    />
                  </div>
                )}
                <h2 className="text-base sm:text-lg font-bold leading-tight">
                  {design.headline || 'Qualificação Estratégica'}
                </h2>
                <p className="text-xs sm:text-sm opacity-75 leading-relaxed">
                  {design.subtitle || 'Responda para avaliarmos seu momento.'}
                </p>

                <div className="pt-2">
                  <button
                    onClick={handleStart}
                    className="w-full py-3 px-6 rounded-full font-semibold text-xs tracking-wide shadow-sm transition-transform active:scale-95 flex items-center justify-center gap-1.5"
                    style={{ backgroundColor: customPrimary, color: '#FFFFFF' }}
                  >
                    <span>Iniciar</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {design.footerText && (
                  <p className="text-[10px] opacity-40 mt-3 leading-tight">
                    {design.footerText}
                  </p>
                )}
              </div>
            )}

            {/* ETAPA 1..N: PERGUNTAS */}
            {currentStep >= 1 && currentStep <= totalQuestions && currentQuestion && (
              <div className="my-auto space-y-4 max-w-md mx-auto w-full">
                <div>
                  <h3 className="text-sm sm:text-base font-bold leading-snug">
                    {currentQuestion.title || 'Título da pergunta'}
                  </h3>
                  {currentQuestion.subtitle && (
                    <p className="text-[11px] sm:text-xs opacity-65 mt-1 leading-relaxed">
                      {currentQuestion.subtitle}
                    </p>
                  )}
                </div>

                {/* Opções Sem Contornos Rígidos */}
                {(currentQuestion.type === 'single_choice' || currentQuestion.type === 'multiple_choice') && (
                  <div className="space-y-2 pt-1">
                    {currentQuestion.options?.map((option, idx) => (
                      <button
                        key={option.id || idx}
                        onClick={() => handleSelectOption(option)}
                        className={`w-full text-left p-3.5 rounded-2xl transition-all flex items-center justify-between text-xs sm:text-sm font-medium active:scale-[0.98] ${
                          isDark
                            ? 'bg-white/[0.08] hover:bg-white/[0.14]'
                            : 'bg-black/[0.04] hover:bg-black/[0.07]'
                        }`}
                      >
                        <span className="flex-1 pr-2">{option.text}</span>
                        <div
                          className="w-4 h-4 rounded-full flex items-center justify-center transition-colors"
                          style={{
                            backgroundColor: answers[currentQuestion.id]?.answer === option.text ? customPrimary : 'transparent'
                          }}
                        >
                          {answers[currentQuestion.id]?.answer === option.text && (
                            <Check className="w-2.5 h-2.5 text-white" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Campo de Texto */}
                {currentQuestion.type === 'short_text' && (
                  <form onSubmit={handleTextSubmit} className="space-y-2.5 pt-1">
                    <input
                      type="text"
                      autoFocus
                      placeholder={currentQuestion.placeholder || 'Sua resposta...'}
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      className={`w-full rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none transition-all ${
                        isDark ? 'bg-white/10 text-white placeholder:text-white/40' : 'bg-black/[0.04] text-[#1D1D1F] placeholder:text-black/40'
                      }`}
                    />
                    <button
                      type="submit"
                      disabled={!textInput.trim() && currentQuestion.required}
                      className="w-full py-2.5 rounded-full text-xs font-semibold flex items-center justify-center gap-1 transition-transform active:scale-95 disabled:opacity-40"
                      style={{ backgroundColor: customPrimary, color: '#FFFFFF' }}
                    >
                      <span>Continuar</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* ETAPA 998: DESQUALIFICADO */}
            {currentStep === 998 && (
              <div className="text-center my-auto space-y-3 animate-fade-in max-w-sm mx-auto">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <h3 className="text-sm sm:text-base font-bold">
                  {disqualification.title || 'Agradecemos o seu tempo'}
                </h3>
                <p className="text-xs opacity-75 leading-relaxed">
                  {disqualification.message || 'No momento seu perfil não atende aos requisitos.'}
                </p>
                <div className="pt-1">
                  <button
                    onClick={handleReset}
                    className="text-[11px] underline opacity-50 hover:opacity-100 transition-opacity"
                  >
                    Recomeçar
                  </button>
                </div>
              </div>
            )}

            {/* ETAPA 999: QUALIFICADO */}
            {currentStep === 999 && (
              <div className="text-center my-auto space-y-3.5 animate-fade-in max-w-sm mx-auto">
                <div className="w-10 h-10 rounded-full bg-emerald-500/15 text-emerald-500 mx-auto flex items-center justify-center">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold">Perfil Aprovado!</h3>
                  <p className="text-xs opacity-75 mt-1 leading-relaxed">
                    {isAutoRedirect
                      ? `Redirecionando para o WhatsApp em ${countdown}s...`
                      : 'Clique no botão abaixo para iniciar o atendimento no WhatsApp.'}
                  </p>
                </div>

                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-5 rounded-full font-semibold text-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 text-white shadow-sm"
                  style={{ backgroundColor: '#25D366' }}
                >
                  <MessageCircle className="w-3.5 h-3.5 fill-current" />
                  <span>{design.buttonText || 'Abrir WhatsApp'}</span>
                </a>

                {isAutoRedirect && (
                  <p className="text-[10px] text-emerald-600 font-medium">
                    ⚡ Redirecionamento automático ativado
                  </p>
                )}
              </div>
            )}

          </div>

          {/* Home Indicator (Apenas Celular e Tablet) */}
          {currentDev.homeBar && (
            <div className="pb-2 text-center">
              <div className={`w-28 h-1 rounded-full mx-auto ${isDark ? 'bg-white/20' : 'bg-black/20'}`}></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
