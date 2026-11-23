import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Check, AlertCircle, MessageCircle, RotateCcw } from 'lucide-react';
import { buildWhatsAppMessage, buildWhatsAppUrl } from '../utils/whatsapp';

export default function MobileSimulator({ funnel }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [textInput, setTextInput] = useState('');

  if (!funnel) {
    return (
      <div className="w-full h-full flex items-center justify-center text-[#86868B] text-xs">
        Nenhum funil carregado
      </div>
    );
  }

  const { design = {}, questions = [], disqualification = {}, whatsapp = {} } = funnel;
  const totalQuestions = questions.length;
  const currentQIndex = currentStep - 1;
  const currentQuestion = questions[currentQIndex];

  const progressPercent = totalQuestions > 0 && currentStep >= 1 && currentStep <= totalQuestions
    ? Math.round((currentStep / totalQuestions) * 100)
    : 0;

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

  return (
    <div className="flex flex-col items-center">
      
      {/* Header do Simulador */}
      <div className="w-full max-w-[340px] flex items-center justify-between mb-2.5 px-2">
        <span className="text-[11px] font-semibold text-[#86868B] tracking-wide">
          SIMULADOR MOBILE
        </span>
        <button
          onClick={handleReset}
          className="inline-flex items-center gap-1 text-[11px] text-[#86868B] hover:text-[#1D1D1F] bg-white px-2 py-0.5 rounded-full shadow-sm transition-colors"
          title="Reiniciar"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reiniciar</span>
        </button>
      </div>

      {/* Frame iPhone Apple Style - Sem Contornos Pesados */}
      <div className="relative w-[340px] h-[680px] bg-[#000000] rounded-[50px] p-3 shadow-[0_24px_50px_rgba(0,0,0,0.18)] flex flex-col">
        
        {/* Dynamic Island */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-5 bg-[#000000] rounded-full z-30 flex items-center justify-between px-3">
          <div className="w-2 h-2 rounded-full bg-white/[0.08]"></div>
          <div className="w-2 h-2 rounded-full bg-blue-900/40"></div>
        </div>

        {/* Tela Interna */}
        <div
          className="relative w-full h-full rounded-[40px] overflow-hidden flex flex-col justify-between transition-colors duration-200"
          style={{ backgroundColor: customBg, color: customText }}
        >
          
          {/* Top Bar Interna */}
          <div className="pt-6 px-4 pb-2 flex items-center justify-between z-20">
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
                className="h-5 max-w-[110px] object-contain"
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
              <div className="text-center my-auto space-y-4">
                {design.logoUrl && (
                  <div className="mb-2 flex justify-center">
                    <img
                      src={design.logoUrl}
                      alt="Logo"
                      className="h-10 max-w-[140px] object-contain"
                    />
                  </div>
                )}
                <h2 className="text-base font-bold leading-tight">
                  {design.headline || 'Qualificação Estratégica'}
                </h2>
                <p className="text-xs opacity-75 leading-relaxed">
                  {design.subtitle || 'Responda para avaliarmos seu momento.'}
                </p>

                <div className="pt-2">
                  <button
                    onClick={handleStart}
                    className="w-full py-3 px-4 rounded-full font-semibold text-xs tracking-wide shadow-sm transition-transform active:scale-95 flex items-center justify-center gap-1.5"
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
              <div className="my-auto space-y-4">
                <div>
                  <h3 className="text-sm font-bold leading-snug">
                    {currentQuestion.title || 'Título da pergunta'}
                  </h3>
                  {currentQuestion.subtitle && (
                    <p className="text-[11px] opacity-65 mt-1 leading-relaxed">
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
                        className={`w-full text-left p-3.5 rounded-2xl transition-all flex items-center justify-between text-xs font-medium active:scale-[0.98] ${
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
                      className={`w-full rounded-xl px-3.5 py-2.5 text-xs focus:outline-none transition-all ${
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
              <div className="text-center my-auto space-y-3 animate-fade-in">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold">
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
              <div className="text-center my-auto space-y-3.5 animate-fade-in">
                <div className="w-10 h-10 rounded-full bg-emerald-500/15 text-emerald-500 mx-auto flex items-center justify-center">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Pré-Qualificado!</h3>
                  <p className="text-xs opacity-75 mt-0.5 leading-relaxed">
                    Clique abaixo para iniciar seu atendimento no WhatsApp.
                  </p>
                </div>

                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-full font-semibold text-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 text-white shadow-sm"
                  style={{ backgroundColor: '#25D366' }}
                >
                  <MessageCircle className="w-3.5 h-3.5 fill-current" />
                  <span>{design.buttonText || 'Abrir WhatsApp'}</span>
                </a>
              </div>
            )}

          </div>

          {/* Home Indicator */}
          <div className="pb-2 text-center">
            <div className={`w-28 h-1 rounded-full mx-auto ${isDark ? 'bg-white/20' : 'bg-black/20'}`}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
