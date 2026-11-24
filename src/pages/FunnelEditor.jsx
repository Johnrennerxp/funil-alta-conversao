import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Smartphone, 
  Palette, 
  ListPlus, 
  Target, 
  MessageSquare, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Upload, 
  ExternalLink,
  FileText,
  Sparkles,
  QrCode,
  Lock,
  Share2
} from 'lucide-react';
import MobileSimulator from '../components/MobileSimulator';
import ShareModal from '../components/ShareModal';
import { getFunnels, saveFunnel } from '../services/firebase';
import { compressImageToBase64 } from '../utils/imageCompression';

const COLOR_PRESETS = [
  {
    name: 'Apple Clean',
    primaryColor: '#0071E3',
    backgroundColor: '#FFFFFF',
    textColor: '#1D1D1F'
  },
  {
    name: 'Midnight Pro',
    primaryColor: '#0A84FF',
    backgroundColor: '#000000',
    textColor: '#FFFFFF'
  },
  {
    name: 'Graphite Slate',
    primaryColor: '#0071E3',
    backgroundColor: '#1C1C1E',
    textColor: '#F5F5F7'
  },
  {
    name: 'Emerald Minimal',
    primaryColor: '#34C759',
    backgroundColor: '#0A2518',
    textColor: '#FFFFFF'
  }
];

export default function FunnelEditor({ funnelId, onBack }) {
  const [activeSubTab, setActiveSubTab] = useState('design');
  const [showSimulator, setShowSimulator] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoMode, setLogoMode] = useState('url');
  const [compressingLogo, setCompressingLogo] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [bulkMode, setBulkMode] = useState('replace'); // 'replace' | 'append'
  const [bulkText, setBulkText] = useState('');

  const BULK_TEMPLATE_EXAMPLE = `1. Qual é o faturamento mensal aproximado da sua empresa?
- Abaixo de R$ 10.000 / mês [x]
- De R$ 10.000 a R$ 50.000 / mês [v]
- Acima de R$ 50.000 / mês [v]

2. Você já possui equipe comercial ativa?
- Sim, já tenho time comercial [v]
- Não, eu mesmo vendo tudo [v]
- Apenas pesquisando sem intenção de contratar [x]

3. Qual é o seu nome e WhatsApp com DDD para contato?
[texto]`;

  const [formData, setFormData] = useState({
    id: funnelId || '',
    slug: 'meu-funil-' + Math.floor(Math.random() * 9000 + 1000),
    status: 'active',
    design: {
      headline: 'Qualificação Estratégica',
      subtitle: 'Responda a 3 perguntas para direcionamento ao time correto.',
      footerText: '🔒 Seus dados estão seguros e protegidos pela LGPD.',
      logoUrl: '',
      primaryColor: '#0071E3',
      backgroundColor: '#FFFFFF',
      textColor: '#1D1D1F',
      whatsappPhone: '5511999999999',
      buttonText: 'Concluir no WhatsApp'
    },
    questions: [
      {
        id: 'q1',
        title: 'Qual é o seu objetivo principal no momento?',
        subtitle: 'Selecione a opção que melhor descreve seu desafio.',
        type: 'single_choice',
        required: true,
        options: [
          { id: 'opt_1', text: 'Quero aumentar minhas vendas imediatamente', isQualified: true },
          { id: 'opt_2', text: 'Quero organizar processos e equipe', isQualified: true },
          { id: 'opt_3', text: 'Apenas curiosidade sem intenção de investir', isQualified: false }
        ]
      },
      {
        id: 'q2',
        title: 'Qual é o seu nome completo e WhatsApp para contato?',
        subtitle: 'Para que o especialista localize sua aplicação.',
        type: 'short_text',
        required: true,
        placeholder: 'Ex: Carlos Silva - (11) 98888-7777'
      }
    ],
    disqualification: {
      title: 'Agradecemos o seu tempo',
      message: 'No momento, nosso atendimento é direcionado a perfis com orçamento imediato de escala. Acompanhe nossos conteúdos abertos para continuar evoluindo.',
      blockRetry: true
    },
    allowBackNavigation: true,
    tracking: {
      pixelId: '',
      webhookUrl: ''
    },
    whatsapp: {
      introText: 'Olá! Concluí a qualificação:',
      outroText: 'Gostaria de dar sequência ao atendimento com o especialista.',
      autoRedirect: true
    }
  });

  useEffect(() => {
    if (funnelId) {
      loadFunnel();
    }
  }, [funnelId]);

  const loadFunnel = async () => {
    try {
      const all = await getFunnels();
      const existing = all.find(f => f.id === funnelId);
      if (existing) {
        setFormData(existing);
      }
    } catch (err) {
      console.error('Erro ao carregar funil:', err);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveMessage('');
      const cleanSlug = formData.slug.toLowerCase().trim().replace(/[^a-z0-9-_]/g, '-');
      const updated = {
        ...formData,
        slug: cleanSlug
      };
      await saveFunnel(updated);
      setFormData(updated);
      setSaveMessage('Salvo!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      alert('Erro ao salvar funil: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setCompressingLogo(true);
      const base64 = await compressImageToBase64(file, 150 * 1024, 600);
      setFormData(prev => ({
        ...prev,
        design: { ...prev.design, logoUrl: base64 }
      }));
    } catch (err) {
      alert('Erro ao comprimir imagem: ' + err.message);
    } finally {
      setCompressingLogo(false);
    }
  };

  const addQuestion = (type = 'single_choice') => {
    const newQ = {
      id: 'q_' + Math.random().toString(36).substring(2, 9),
      title: 'Nova Pergunta ' + (formData.questions.length + 1),
      subtitle: '',
      type,
      required: true,
      options: type === 'short_text' ? [] : [
        { id: 'opt_' + Math.random().toString(36).substring(2, 7), text: 'Opção Qualificada', isQualified: true },
        { id: 'opt_' + Math.random().toString(36).substring(2, 7), text: 'Opção Desqualificada', isQualified: false }
      ],
      placeholder: type === 'short_text' ? 'Digite sua resposta...' : ''
    };

    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, newQ]
    }));
  };

  const updateQuestion = (qIndex, updates) => {
    setFormData(prev => {
      const qList = [...prev.questions];
      qList[qIndex] = { ...qList[qIndex], ...updates };
      return { ...prev, questions: qList };
    });
  };

  const removeQuestion = (qIndex) => {
    if (formData.questions.length <= 1) {
      alert('O formulário deve ter no mínimo 1 pergunta.');
      return;
    }
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, idx) => idx !== qIndex)
    }));
  };

  const addOptionToQuestion = (qIndex) => {
    setFormData(prev => {
      const qList = [...prev.questions];
      const currentOpts = qList[qIndex].options || [];
      qList[qIndex].options = [
        ...currentOpts,
        {
          id: 'opt_' + Math.random().toString(36).substring(2, 7),
          text: `Nova Opção ${currentOpts.length + 1}`,
          isQualified: true
        }
      ];
      return { ...prev, questions: qList };
    });
  };

  const updateOption = (qIndex, optIndex, updates) => {
    setFormData(prev => {
      const qList = [...prev.questions];
      const opts = [...qList[qIndex].options];
      opts[optIndex] = { ...opts[optIndex], ...updates };
      qList[qIndex].options = opts;
      return { ...prev, questions: qList };
    });
  };

  const removeOption = (qIndex, optIndex) => {
    setFormData(prev => {
      const qList = [...prev.questions];
      qList[qIndex].options = qList[qIndex].options.filter((_, idx) => idx !== optIndex);
      return { ...prev, questions: qList };
    });
  };

  const handleImportBulk = () => {
    if (!bulkText.trim()) {
      alert('Cole o texto das perguntas antes de importar.');
      return;
    }

    const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean);
    const parsedQuestions = [];
    let currentQ = null;

    for (let line of lines) {
      const isOptionLine = /^[-*•]|\([a-z0-9]\)|\[[vx\+\-]/i.test(line);
      const isTextPlaceholder = /^\[texto\]|^\[text\]|^\(texto\)/i.test(line);

      if (isTextPlaceholder && currentQ) {
        currentQ.type = 'short_text';
        currentQ.options = [];
        currentQ.placeholder = 'Digite sua resposta...';
        continue;
      }

      if (!isOptionLine && !isTextPlaceholder) {
        // Nova pergunta
        const cleanTitle = line.replace(/^(\d+[\.\)]|pergunta\s*\d+:?|p\d+:?)\s*/i, '').trim();
        currentQ = {
          id: 'q_' + Math.random().toString(36).substring(2, 9),
          title: cleanTitle,
          subtitle: '',
          type: 'single_choice',
          required: true,
          options: []
        };
        parsedQuestions.push(currentQ);
      } else if (isOptionLine && currentQ) {
        let text = line.replace(/^[-*•]\s*/, '').trim();
        let isQualified = true;

        if (/\[(x|-|desqualificado|desqualificada|nao|não)\]/i.test(text)) {
          isQualified = false;
          text = text.replace(/\[(x|-|desqualificado|desqualificada|nao|não)\]/gi, '').trim();
        } else if (/\[(v|\+|qualificado|qualificada|sim|ok)\]/i.test(text)) {
          isQualified = true;
          text = text.replace(/\[(v|\+|qualificado|qualificada|sim|ok)\]/gi, '').trim();
        }

        currentQ.options.push({
          id: 'opt_' + Math.random().toString(36).substring(2, 7),
          text: text,
          isQualified: isQualified
        });
      }
    }

    for (let q of parsedQuestions) {
      if (q.options.length === 0) {
        q.type = 'short_text';
        q.placeholder = 'Digite sua resposta...';
      }
    }

    if (parsedQuestions.length === 0) {
      alert('Nenhuma pergunta identificada. Verifique o modelo e tente novamente.');
      return;
    }

    setFormData(prev => ({
      ...prev,
      questions: bulkMode === 'replace' ? parsedQuestions : [...prev.questions, ...parsedQuestions]
    }));

    setShowBulkModal(false);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-16">
      
      {/* Barra de Controle Superior Apple Style */}
      <div className="sticky top-0 z-30 apple-blur border-b border-black/[0.04] px-4 sm:px-6 py-2.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-1.5 text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/[0.04] rounded-full transition-colors"
              title="Voltar"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#1D1D1F]">Slug:</span>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="slug-do-funil"
                className="font-mono text-xs font-medium text-[#0071E3] bg-black/[0.04] px-2 py-0.5 rounded-md focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {saveMessage && (
              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 animate-fade-in">
                <Check className="w-3.5 h-3.5" />
                {saveMessage}
              </span>
            )}

            <button
              onClick={() => setShowSimulator(!showSimulator)}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-black/[0.04] text-[#1D1D1F] hover:bg-black/[0.08]"
            >
              <Smartphone className="w-3.5 h-3.5 text-[#86868B]" />
              <span>{showSimulator ? 'Ocultar Preview' : 'Ver Preview'}</span>
            </button>

            <a
              href={`#/f/${formData.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full bg-black/[0.04] text-[#1D1D1F] hover:bg-black/[0.08]"
            >
              <ExternalLink className="w-3 h-3 text-[#86868B]" />
              <span>Testar</span>
            </a>

            <button
              type="button"
              onClick={() => setShowShareModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-black/[0.04] text-[#1D1D1F] hover:bg-black/[0.08] transition-colors"
              title="Abrir QR Code, Link Curto, WhatsApp e E-mail"
            >
              <QrCode className="w-3.5 h-3.5 text-[#0071E3]" />
              <span>Compartilhar / QR</span>
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-1 bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold rounded-full shadow-sm active:scale-95 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Salvando...' : 'Salvar'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid Principal */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* PAINEL ESQUERDO: CONFIGURAÇÃO */}
          <div className={`space-y-4 ${showSimulator ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
            
            {/* Seletor Segmentado Apple Style */}
            <div className="flex items-center apple-segmented-bg">
              <button
                onClick={() => setActiveSubTab('design')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs apple-segmented-item ${
                  activeSubTab === 'design' ? 'apple-segmented-item-active' : 'text-[#86868B] hover:text-[#1D1D1F]'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>1. Design</span>
              </button>

              <button
                onClick={() => setActiveSubTab('questions')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs apple-segmented-item ${
                  activeSubTab === 'questions' ? 'apple-segmented-item-active' : 'text-[#86868B] hover:text-[#1D1D1F]'
                }`}
              >
                <ListPlus className="w-3.5 h-3.5" />
                <span>2. Perguntas</span>
              </button>

              <button
                onClick={() => setActiveSubTab('tracking')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs apple-segmented-item ${
                  activeSubTab === 'tracking' ? 'apple-segmented-item-active' : 'text-[#86868B] hover:text-[#1D1D1F]'
                }`}
              >
                <Target className="w-3.5 h-3.5" />
                <span>3. Rastreamento</span>
              </button>

              <button
                onClick={() => setActiveSubTab('whatsapp')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs apple-segmented-item ${
                  activeSubTab === 'whatsapp' ? 'apple-segmented-item-active' : 'text-[#86868B] hover:text-[#1D1D1F]'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>4. WhatsApp</span>
              </button>
            </div>

            {/* ABA 1: DESIGN */}
            {activeSubTab === 'design' && (
              <div className="apple-card p-6 space-y-6">
                
                {/* Logo */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#1D1D1F]">Logotipo</span>
                    <div className="flex items-center apple-segmented-bg">
                      <button
                        type="button"
                        onClick={() => setLogoMode('url')}
                        className={`px-2.5 py-0.5 text-[11px] apple-segmented-item ${logoMode === 'url' ? 'apple-segmented-item-active' : 'text-[#86868B]'}`}
                      >
                        URL
                      </button>
                      <button
                        type="button"
                        onClick={() => setLogoMode('upload')}
                        className={`px-2.5 py-0.5 text-[11px] apple-segmented-item ${logoMode === 'upload' ? 'apple-segmented-item-active' : 'text-[#86868B]'}`}
                      >
                        Upload Local
                      </button>
                    </div>
                  </div>

                  {logoMode === 'url' ? (
                    <input
                      type="url"
                      placeholder="https://exemplo.com/logo.png"
                      value={formData.design.logoUrl}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        design: { ...prev.design, logoUrl: e.target.value }
                      }))}
                      className="w-full px-4 py-2.5 rounded-xl bg-black/[0.04] text-xs text-[#1D1D1F] focus:bg-white focus:ring-2 focus:ring-[#0071E3]/20 focus:outline-none transition-all"
                    />
                  ) : (
                    <label className="flex flex-col items-center justify-center p-4 bg-black/[0.03] hover:bg-black/[0.05] rounded-xl cursor-pointer transition-colors">
                      <Upload className="w-4 h-4 text-[#86868B] mb-1" />
                      <span className="text-xs font-medium text-[#1D1D1F]">
                        {compressingLogo ? 'Comprimindo...' : 'Selecionar imagem'}
                      </span>
                      <span className="text-[10px] text-[#86868B]">Comprimido automaticamente para &lt; 150KB</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                  )}

                  {formData.design.logoUrl && (
                    <div className="flex items-center justify-between pt-1">
                      <img
                        src={formData.design.logoUrl}
                        alt="Logo"
                        className="h-7 max-w-[120px] object-contain rounded"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, design: { ...prev.design, logoUrl: '' } }))}
                        className="text-[11px] text-[#FF3B30] hover:underline"
                      >
                        Remover
                      </button>
                    </div>
                  )}
                </div>

                {/* Textos */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
                      Título (Headline)
                    </label>
                    <input
                      type="text"
                      value={formData.design.headline}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        design: { ...prev.design, headline: e.target.value }
                      }))}
                      className="w-full px-4 py-2.5 rounded-xl bg-black/[0.04] text-xs font-medium text-[#1D1D1F] focus:bg-white focus:ring-2 focus:ring-[#0071E3]/20 focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
                      Subtítulo
                    </label>
                    <textarea
                      rows={2}
                      value={formData.design.subtitle}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        design: { ...prev.design, subtitle: e.target.value }
                      }))}
                      className="w-full px-4 py-2.5 rounded-xl bg-black/[0.04] text-xs text-[#1D1D1F] focus:bg-white focus:ring-2 focus:ring-[#0071E3]/20 focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
                      Rodapé (Segurança / LGPD)
                    </label>
                    <input
                      type="text"
                      value={formData.design.footerText}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        design: { ...prev.design, footerText: e.target.value }
                      }))}
                      className="w-full px-4 py-2 rounded-xl bg-black/[0.04] text-xs text-[#86868B] focus:bg-white focus:ring-2 focus:ring-[#0071E3]/20 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Paleta Apple */}
                <div className="space-y-3 pt-4 border-t border-black/[0.04]">
                  <span className="block text-xs font-semibold text-[#1D1D1F]">Paletas Pré-definidas</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {COLOR_PRESETS.map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          design: {
                            ...prev.design,
                            primaryColor: p.primaryColor,
                            backgroundColor: p.backgroundColor,
                            textColor: p.textColor
                          }
                        }))}
                        className="p-2.5 rounded-xl bg-black/[0.03] hover:bg-black/[0.06] text-left transition-all"
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.primaryColor }}></span>
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.backgroundColor }}></span>
                        </div>
                        <span className="text-[11px] font-medium text-[#1D1D1F] block truncate">{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* WhatsApp & CTA */}
                <div className="space-y-4 pt-4 border-t border-black/[0.04]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                        WhatsApp de Destino
                      </label>
                      <input
                        type="text"
                        placeholder="5511999999999"
                        value={formData.design.whatsappPhone}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          design: { ...prev.design, whatsappPhone: e.target.value }
                        }))}
                        className="w-full px-4 py-2.5 rounded-xl bg-black/[0.04] text-xs font-mono text-[#1D1D1F] focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                        Texto do Botão
                      </label>
                      <input
                        type="text"
                        value={formData.design.buttonText}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          design: { ...prev.design, buttonText: e.target.value }
                        }))}
                        className="w-full px-4 py-2.5 rounded-xl bg-black/[0.04] text-xs text-[#1D1D1F] focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* ABA 2: PERGUNTAS */}
            {activeSubTab === 'questions' && (
              <div className="space-y-4">
                <div className="apple-card p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-[#1D1D1F]">Perguntas ({formData.questions.length})</h3>
                      <p className="text-xs text-[#86868B]">Fluxo estilo Typeform com qualificação por opção.</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          setBulkText(BULK_TEMPLATE_EXAMPLE);
                          setShowBulkModal(true);
                        }}
                        className="px-3 py-1 text-xs font-semibold bg-emerald-500/10 text-emerald-800 hover:bg-emerald-500/20 rounded-full transition-colors flex items-center gap-1"
                        title="Importar perguntas e respostas qualificadas colando um texto"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Copia e Cola (Massa)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => addQuestion('single_choice')}
                        className="px-3 py-1 text-xs font-medium bg-[#0071E3]/10 text-[#0071E3] hover:bg-[#0071E3]/20 rounded-full transition-colors"
                      >
                        + Seleção
                      </button>
                      <button
                        type="button"
                        onClick={() => addQuestion('short_text')}
                        className="px-3 py-1 text-xs font-medium bg-black/[0.05] text-[#1D1D1F] hover:bg-black/[0.08] rounded-full transition-colors"
                      >
                        + Texto
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 pt-1">
                    {formData.questions.map((q, qIdx) => (
                      <div
                        key={q.id || qIdx}
                        className="p-4 rounded-xl bg-black/[0.025] space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-[#86868B]">
                            Pergunta {qIdx + 1} • {q.type === 'short_text' ? 'Texto' : 'Múltipla Escolha'}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeQuestion(qIdx)}
                            className="p-1 text-[#86868B] hover:text-[#FF3B30] rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Pergunta..."
                            value={q.title}
                            onChange={(e) => updateQuestion(qIdx, { title: e.target.value })}
                            className="w-full px-3.5 py-2 text-xs font-medium rounded-lg bg-white shadow-sm focus:outline-none text-[#1D1D1F]"
                          />
                          <input
                            type="text"
                            placeholder="Subtítulo ou instrução (opcional)"
                            value={q.subtitle}
                            onChange={(e) => updateQuestion(qIdx, { subtitle: e.target.value })}
                            className="w-full px-3.5 py-1.5 text-xs rounded-lg bg-white/60 focus:bg-white text-[#86868B] focus:outline-none"
                          />
                        </div>

                        {q.type !== 'short_text' && (
                          <div className="space-y-2 pt-1">
                            {q.options?.map((opt, optIdx) => (
                              <div key={opt.id || optIdx} className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={opt.text}
                                  onChange={(e) => updateOption(qIdx, optIdx, { text: e.target.value })}
                                  className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-white shadow-sm focus:outline-none text-[#1D1D1F]"
                                />

                                <button
                                  type="button"
                                  onClick={() => updateOption(qIdx, optIdx, { isQualified: !opt.isQualified })}
                                  className={`px-2.5 py-1 text-[10px] font-semibold rounded-full transition-all flex items-center gap-1 ${
                                    opt.isQualified
                                      ? 'bg-emerald-500/10 text-emerald-800'
                                      : 'bg-rose-500/10 text-rose-800'
                                  }`}
                                >
                                  {opt.isQualified ? (
                                    <>
                                      <Check className="w-3 h-3" />
                                      <span>Qualificado</span>
                                    </>
                                  ) : (
                                    <>
                                      <X className="w-3 h-3" />
                                      <span>Desqualificado</span>
                                    </>
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => removeOption(qIdx, optIdx)}
                                  className="p-1 text-[#86868B] hover:text-[#FF3B30]"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}

                            <button
                              type="button"
                              onClick={() => addOptionToQuestion(qIdx)}
                              className="text-[11px] font-medium text-[#0071E3] hover:underline pt-0.5 block"
                            >
                              + Adicionar Opção
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Desqualificação & Regras de Retorno */}
                <div className="apple-card p-6 space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-[#1D1D1F]">Tela de Encerramento (Desqualificados)</h3>
                    <p className="text-xs text-[#86868B]">Defina o texto e o comportamento de bloqueio para quem responder errado ou for desqualificado.</p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#1D1D1F] mb-1">
                        Título do Encerramento
                      </label>
                      <input
                        type="text"
                        placeholder="Título (ex: Agradecemos o seu tempo)"
                        value={formData.disqualification?.title || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          disqualification: { ...prev.disqualification, title: e.target.value }
                        }))}
                        className="w-full px-4 py-2 rounded-xl bg-black/[0.04] text-xs font-medium text-[#1D1D1F] focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#1D1D1F] mb-1">
                        Mensagem Explicativa
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Mensagem educada"
                        value={formData.disqualification?.message || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          disqualification: { ...prev.disqualification, message: e.target.value }
                        }))}
                        className="w-full px-4 py-2 rounded-xl bg-black/[0.04] text-xs text-[#86868B] focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Configurações de Bloqueio & Não Voltar */}
                  <div className="pt-3 border-t border-black/[0.06] space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer select-none group">
                      <input
                        type="checkbox"
                        checked={formData.disqualification?.blockRetry !== false}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          disqualification: { ...prev.disqualification, blockRetry: e.target.checked }
                        }))}
                        className="mt-0.5 w-4 h-4 rounded text-[#0071E3] focus:ring-[#0071E3] border-gray-300"
                      />
                      <div>
                        <span className="text-xs font-semibold text-[#1D1D1F] flex items-center gap-1.5 group-hover:text-[#0071E3] transition-colors">
                          <Lock className="w-3.5 h-3.5 text-rose-500" />
                          Bloquear retorno se responder errado ou for desqualificado
                        </span>
                        <p className="text-[11px] text-[#86868B] mt-0.5 leading-relaxed">
                          Impede o lead de voltar atrás, remove o botão de recomeçar, bloqueia o botão voltar do navegador e salva o bloqueio no aparelho dele para não conseguir refazer.
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer select-none group pt-1">
                      <input
                        type="checkbox"
                        checked={formData.allowBackNavigation !== false}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          allowBackNavigation: e.target.checked
                        }))}
                        className="mt-0.5 w-4 h-4 rounded text-[#0071E3] focus:ring-[#0071E3] border-gray-300"
                      />
                      <div>
                        <span className="text-xs font-semibold text-[#1D1D1F] group-hover:text-[#0071E3] transition-colors">
                          Permitir botão de voltar entre perguntas normais
                        </span>
                        <p className="text-[11px] text-[#86868B] mt-0.5 leading-relaxed">
                          Se desativado, oculta a seta de voltar no topo durante todo o formulário (o lead só pode avançar para frente).
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* ABA 3: RASTREAMENTO */}
            {activeSubTab === 'tracking' && (
              <div className="apple-card p-6 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-[#1D1D1F]">Meta Ads & Webhook</h3>
                  <p className="text-xs text-[#86868B]">PageView ao abrir e Lead apenas na qualificação.</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                      ID do Pixel da Meta
                    </label>
                    <input
                      type="text"
                      placeholder="123456789012345"
                      value={formData.tracking?.pixelId || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        tracking: { ...prev.tracking, pixelId: e.target.value }
                      }))}
                      className="w-full px-4 py-2.5 rounded-xl bg-black/[0.04] text-xs font-mono text-[#1D1D1F] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                      Webhook Externo (n8n / Make / CRM)
                    </label>
                    <input
                      type="url"
                      placeholder="https://seu-n8n.com/webhook/lead-funnel"
                      value={formData.tracking?.webhookUrl || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        tracking: { ...prev.tracking, webhookUrl: e.target.value }
                      }))}
                      className="w-full px-4 py-2.5 rounded-xl bg-black/[0.04] text-xs font-mono text-[#1D1D1F] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="p-4 bg-black/[0.03] rounded-xl text-xs space-y-1 text-[#86868B]">
                    <span className="font-semibold text-[#1D1D1F] block">Captura Automática de UTMs:</span>
                    <p>Lê automaticamente: <code className="font-mono text-[#1D1D1F]">utm_source</code>, <code className="font-mono text-[#1D1D1F]">utm_medium</code>, <code className="font-mono text-[#1D1D1F]">utm_campaign</code>, <code className="font-mono text-[#1D1D1F]">fbclid</code> da URL e inclui no webhook.</p>
                  </div>
                </div>
              </div>
            )}

            {/* ABA 4: WHATSAPP */}
            {activeSubTab === 'whatsapp' && (
              <div className="apple-card p-6 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-[#1D1D1F]">Síntese da Mensagem</h3>
                  <p className="text-xs text-[#86868B]">Formatada de forma limpa para envio direto.</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                      Texto de Abertura
                    </label>
                    <input
                      type="text"
                      value={formData.whatsapp?.introText || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        whatsapp: { ...prev.whatsapp, introText: e.target.value }
                      }))}
                      className="w-full px-4 py-2.5 rounded-xl bg-black/[0.04] text-xs text-[#1D1D1F] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                      Texto de Fechamento
                    </label>
                    <input
                      type="text"
                      value={formData.whatsapp?.outroText || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        whatsapp: { ...prev.whatsapp, outroText: e.target.value }
                      }))}
                      className="w-full px-4 py-2.5 rounded-xl bg-black/[0.04] text-xs text-[#1D1D1F] focus:bg-white focus:outline-none"
                    />
                  </div>

                  {/* Toggle: Redirecionamento Automático para WhatsApp */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-black/[0.025] mt-2">
                    <div>
                      <span className="text-xs font-semibold text-[#1D1D1F] block">
                        Redirecionamento Automático
                      </span>
                      <p className="text-[11px] text-[#86868B] mt-0.5">
                        {formData.whatsapp?.autoRedirect !== false
                          ? 'O lead qualificado é enviado automaticamente ao WhatsApp após 3 segundos.'
                          : 'O lead qualificado visualiza a tela de aprovação com o botão e clica manualmente.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        whatsapp: {
                          ...prev.whatsapp,
                          autoRedirect: prev.whatsapp?.autoRedirect === false ? true : false
                        }
                      }))}
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                        formData.whatsapp?.autoRedirect !== false ? 'bg-[#34C759]' : 'bg-black/20'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                          formData.whatsapp?.autoRedirect !== false ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* PAINEL DIREITO: SIMULADOR REAL-TIME (CELULAR, TABLET, PC) */}
          {showSimulator && (
            <div className="lg:col-span-5 sticky top-16 flex justify-center pb-8">
              <MobileSimulator funnel={formData} />
            </div>
          )}

        </div>
      </div>

      {/* MODAL COPIA E COLA (IMPORTAÇÃO EM MASSA) */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white max-w-xl w-full rounded-3xl shadow-2xl p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#1D1D1F] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#0071E3]" />
                  <span>Copia e Cola de Perguntas & Qualificação</span>
                </h3>
                <p className="text-xs text-[#86868B] mt-0.5">
                  Cole perguntas prontas com tags <strong className="text-emerald-600">[v]</strong> (qualificado) e <strong className="text-rose-600">[x]</strong> (desqualificado).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="p-1.5 text-[#86868B] hover:text-[#1D1D1F] rounded-full hover:bg-black/[0.05]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#1D1D1F]">Modo:</span>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="bulkMode"
                    value="replace"
                    checked={bulkMode === 'replace'}
                    onChange={() => setBulkMode('replace')}
                  />
                  <span>Substituir existentes</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer ml-2">
                  <input
                    type="radio"
                    name="bulkMode"
                    value="append"
                    checked={bulkMode === 'append'}
                    onChange={() => setBulkMode('append')}
                  />
                  <span>Adicionar ao final</span>
                </label>
              </div>

              <button
                type="button"
                onClick={() => setBulkText(BULK_TEMPLATE_EXAMPLE)}
                className="text-xs font-semibold text-[#0071E3] hover:underline"
              >
                Restaurar Exemplo
              </button>
            </div>

            <textarea
              rows={12}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder="Cole aqui o texto..."
              className="w-full flex-1 p-3.5 rounded-2xl bg-black/[0.03] text-xs font-mono text-[#1D1D1F] focus:bg-white focus:ring-2 focus:ring-[#0071E3]/20 focus:outline-none resize-none leading-relaxed"
            />

            <div className="p-3 bg-black/[0.03] rounded-xl text-[11px] text-[#86868B] space-y-1">
              <p><strong>Regras simples de formatação:</strong></p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Linhas numeradas ou títulos viram a pergunta (ex: <code className="text-[#1D1D1F]">1. Qual seu faturamento?</code>).</li>
                <li>Opções iniciadas com hífen <code className="text-[#1D1D1F]">- Opção [v]</code> (qualificado) ou <code className="text-[#1D1D1F]">- Opção [x]</code> (desqualificado).</li>
                <li>Para perguntas abertas, digite <code className="text-[#1D1D1F]">[texto]</code> abaixo do título.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 text-xs font-semibold text-[#86868B] hover:text-[#1D1D1F] rounded-full"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleImportBulk}
                className="px-5 py-2 text-xs font-semibold bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-full shadow-sm active:scale-95"
              >
                Importar Perguntas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Compartilhamento & Acesso Fácil */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        funnel={formData}
      />
    </div>
  );
}
