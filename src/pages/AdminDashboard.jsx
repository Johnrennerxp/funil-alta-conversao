import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Copy, 
  ExternalLink, 
  Edit3, 
  CopyPlus, 
  Trash2, 
  Check, 
  UserPlus, 
  UserX, 
  CheckCircle2, 
  ShieldAlert,
  FileSpreadsheet,
  Download,
  Filter,
  Code2,
  Calendar,
  Layers,
  ShieldCheck,
  Eye,
  Key,
  Lock,
  Search,
  X,
  MessageCircle
} from 'lucide-react';
import { 
  getFunnels, 
  deleteFunnel, 
  duplicateFunnel, 
  getAuthorizedUsers, 
  addAuthorizedUser, 
  updateUserPermissions,
  removeAuthorizedUser,
  getFunnelMetrics,
  getFormSubmissions,
  getClientAccounts,
  createClientAccount,
  deleteClientAccount,
  toggleClientStatus
} from '../services/firebase';
import { exportSubmissionsToCSV } from '../utils/spreadsheet';

export default function AdminDashboard({ activeTab, user, onEditFunnel, onCreateNew }) {
  const [funnels, setFunnels] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [authorizedUsers, setAuthorizedUsers] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedFunnelFilter, setSelectedFunnelFilter] = useState('all');
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    passwordInitial: '',
    whatsapp: '',
    plan: 'Plano Pro'
  });
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    canViewFunnels: true,
    canCreateFunnels: true,
    canEditFunnels: true,
    canViewSubmissions: true
  });
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [actionMessage, setActionMessage] = useState({ text: '', type: '' });
  const [copiedScript, setCopiedScript] = useState(false);
  const [viewingSubmissionsFunnel, setViewingSubmissionsFunnel] = useState(null);
  const [submissionSearch, setSubmissionSearch] = useState('');
  const [subFilter, setSubFilter] = useState('all'); // 'all' | 'qualified' | 'disqualified'

  useEffect(() => {
    loadDashboardData();
  }, [activeTab]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [listFunnels, listUsers, listSubmissions, listClients] = await Promise.all([
        getFunnels(),
        getAuthorizedUsers(),
        getFormSubmissions(),
        getClientAccounts()
      ]);
      setFunnels(listFunnels);
      setAuthorizedUsers(listUsers);
      setSubmissions(listSubmissions);
      setClients(listClients);

      const metricMap = {};
      for (const f of listFunnels) {
        metricMap[f.id] = await getFunnelMetrics(f.id);
      }
      setMetrics(metricMap);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (text, type = 'success') => {
    setActionMessage({ text, type });
    setTimeout(() => setActionMessage({ text: '', type: '' }), 3500);
  };

  const handleCopyLink = (slug, id) => {
    const origin = window.location.origin;
    const path = window.location.pathname;
    const fullUrl = `${origin}${path}#/f/${slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
    showNotification('Link copiado!');
  };

  const handleDeleteFunnel = async (id, title) => {
    if (!window.confirm(`Excluir funil "${title}"?`)) return;
    try {
      await deleteFunnel(id);
      showNotification('Funil removido.');
      loadDashboardData();
    } catch (err) {
      showNotification(err.message || 'Erro ao excluir.', 'error');
    }
  };

  const handleDuplicate = async (id) => {
    try {
      await duplicateFunnel(id);
      showNotification('Funil duplicado.');
      loadDashboardData();
    } catch (err) {
      showNotification(err.message || 'Erro ao duplicar.', 'error');
    }
  };

  const handleExportSpreadsheet = (funnelId = null, title = 'Respostas') => {
    const filtered = funnelId 
      ? submissions.filter(s => s.formId === funnelId) 
      : submissions;
    
    if (filtered.length === 0) {
      showNotification('Nenhuma resposta encontrada para este formulário.', 'error');
      return;
    }

    exportSubmissionsToCSV(filtered, title);
    showNotification('Planilha CSV/Excel gerada e baixada com sucesso!');
  };

  const isMaster = user?.isMaster || user?.email?.toLowerCase().trim() === 'johnrenneradm@gmail.com';
  const canViewFunnels = isMaster || user?.permissions?.canViewFunnels !== false;
  const canCreateFunnels = isMaster || user?.permissions?.canCreateFunnels !== false;
  const canEditFunnels = isMaster || user?.permissions?.canEditFunnels !== false;
  const canViewSubmissions = isMaster || user?.permissions?.canViewSubmissions !== false;

  const handleCreateUserWithPerms = async (e) => {
    e.preventDefault();
    if (!newUser.email.trim()) return;
    try {
      await addAuthorizedUser(
        newUser.email.trim(),
        {
          canViewFunnels: newUser.canViewFunnels,
          canCreateFunnels: newUser.canCreateFunnels,
          canEditFunnels: newUser.canEditFunnels,
          canViewSubmissions: newUser.canViewSubmissions
        },
        newUser.name.trim(),
        user?.email || 'admin'
      );
      setNewUser({
        name: '',
        email: '',
        canViewFunnels: true,
        canCreateFunnels: true,
        canEditFunnels: true,
        canViewSubmissions: true
      });
      showNotification(`Usuário ${newUser.email.trim()} adicionado com permissões definidas.`);
      const updated = await getAuthorizedUsers();
      setAuthorizedUsers(updated);
    } catch (err) {
      showNotification(err.message || 'Erro ao adicionar usuário.', 'error');
    }
  };

  const handleToggleUserPermission = async (userEmail, permKey, currentVal) => {
    const targetUser = authorizedUsers.find(u => u.email === userEmail);
    if (!targetUser) return;
    if (targetUser.role === 'super_admin' || userEmail === 'johnrenneradm@gmail.com') {
      showNotification('O Proprietário Master possui todas as permissões fixas.', 'error');
      return;
    }

    const updatedPerms = {
      ...(targetUser.permissions || {
        canViewFunnels: true,
        canCreateFunnels: true,
        canEditFunnels: true,
        canViewSubmissions: true
      }),
      [permKey]: !currentVal
    };

    try {
      await updateUserPermissions(userEmail, updatedPerms);
      setAuthorizedUsers(prev => prev.map(u => u.email === userEmail ? { ...u, permissions: updatedPerms } : u));
      showNotification(`Permissão "${permKey}" atualizada para ${userEmail}.`);
    } catch (err) {
      showNotification(err.message || 'Erro ao atualizar permissão.', 'error');
    }
  };

  const handleRemoveUser = async (email) => {
    if (!window.confirm(`Remover acesso para: ${email}?`)) return;
    try {
      await removeAuthorizedUser(email, user?.email);
      showNotification(`Acesso de ${email} revogado.`);
      const updated = await getAuthorizedUsers();
      setAuthorizedUsers(updated);
    } catch (err) {
      showNotification(err.message || 'Erro ao remover.', 'error');
    }
  };

  const handleCopyGoogleScript = () => {
    const script = `// Código Google Apps Script para inserir respostas direto no Google Sheets
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  
  var row = [
    new Date(),
    data.funnelTitle || '',
    data.status || 'qualified',
    data.targetWhatsApp || ''
  ];
  
  // Adiciona as respostas
  (data.answers || []).forEach(function(item) {
    row.push(item.question + ": " + (Array.isArray(item.answer) ? item.answer.join(", ") : item.answer));
  });
  
  // Adiciona UTMs
  var tr = data.tracking || {};
  row.push(tr.utm_source || '', tr.utm_campaign || '', tr.utm_content || '', tr.fbclid || '');
  
  sheet.appendRow(row);
  return ContentService.createTextOutput(JSON.stringify({"result": "success"})).setMimeType(ContentService.MimeType.JSON);
}`;
    navigator.clipboard.writeText(script);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 3000);
    showNotification('Script copiado!');
  };

  const totalViews = Object.values(metrics).reduce((acc, m) => acc + (m.views || 0), 0);
  const totalQualified = Object.values(metrics).reduce((acc, m) => acc + (m.qualified || 0), 0);
  const totalDisqualified = Object.values(metrics).reduce((acc, m) => acc + (m.disqualified || 0), 0);
  const totalLeads = totalQualified + totalDisqualified;
  const overallRate = totalLeads > 0 ? ((totalQualified / totalLeads) * 100).toFixed(1) : '0.0';

  const visibleSubmissions = selectedFunnelFilter === 'all'
    ? submissions
    : submissions.filter(s => s.formId === selectedFunnelFilter);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      
      {/* Toast Notificação Apple Style */}
      {actionMessage.text && (
        <div
          className={`fixed bottom-8 right-8 z-50 px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 text-xs font-medium text-white animate-fade-in ${
            actionMessage.type === 'error' ? 'bg-[#FF3B30]' : 'bg-[#1D1D1F]'
          }`}
        >
          {actionMessage.type === 'error' ? <ShieldAlert className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* ABA 1: FUNIS & MÉTRICAS                                  */}
      {/* ======================================================== */}
      {activeTab === 'funnels' && (
        <div className="space-y-6">
          
          {/* Header Superior Limpo */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">
                Funis de Conversão
              </h1>
              <p className="text-xs text-[#86868B] mt-0.5">
                Crie experiências fluidas e direcione leads qualificados para o WhatsApp.
              </p>
            </div>
            {canCreateFunnels && (
              <button
                onClick={onCreateNew}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold rounded-full transition-all shadow-sm active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Funil</span>
              </button>
            )}
          </div>

          {/* Cards de Métricas Sem Contornos Duros */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="apple-card p-5">
              <span className="text-[11px] font-medium text-[#86868B]">Acessos Totais</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1D1D1F]">{totalViews}</span>
                <span className="text-[11px] text-[#86868B]">visitas</span>
              </div>
            </div>

            <div className="apple-card p-5">
              <span className="text-[11px] font-medium text-[#34C759]">Qualificados</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#34C759]">{totalQualified}</span>
                <span className="text-[11px] text-[#86868B]">WhatsApp</span>
              </div>
            </div>

            <div className="apple-card p-5">
              <span className="text-[11px] font-medium text-[#86868B]">Desqualificados</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#86868B]">{totalDisqualified}</span>
                <span className="text-[11px] text-[#86868B]">filtrados</span>
              </div>
            </div>

            <div className="apple-card p-5">
              <span className="text-[11px] font-medium text-[#0071E3]">Taxa de Conversão</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0071E3]">{overallRate}%</span>
                <span className="text-[11px] text-[#86868B]">qualificação</span>
              </div>
            </div>
          </div>

          {/* Lista de Funis - Apple Card Limpo */}
          <div className="apple-card overflow-hidden">
            <div className="px-6 py-4 flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#86868B]">
                Formulários ({funnels.length})
              </h2>
            </div>

            {loading ? (
              <div className="p-12 text-center text-xs text-[#86868B]">Carregando...</div>
            ) : funnels.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <p className="text-sm font-medium text-[#1D1D1F]">Nenhum funil criado ainda</p>
                <p className="text-xs text-[#86868B]">Comece criando um formulário minimalista de alta conversão.</p>
                <button
                  onClick={onCreateNew}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0071E3] text-white text-xs font-semibold rounded-full"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Criar Funil</span>
                </button>
              </div>
            ) : (
              <div className="divide-y divide-black/[0.04]">
                {funnels.map((funnel) => {
                  const m = metrics[funnel.id] || { views: 0, qualified: 0, disqualified: 0, rate: '0.0' };
                  const subCount = submissions.filter(s => s.formId === funnel.id).length;
                  return (
                    <div
                      key={funnel.id}
                      className="p-5 sm:px-6 hover:bg-black/[0.015] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      {/* Título & Rota */}
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#1D1D1F] text-sm truncate max-w-md">
                            {funnel.design?.headline || 'Funil Sem Título'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide ${
                              funnel.status === 'active'
                                ? 'bg-emerald-500/10 text-emerald-800'
                                : 'bg-black/[0.05] text-[#86868B]'
                            }`}
                          >
                            {funnel.status === 'active' ? 'Ativo' : 'Pausado'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-[#86868B]">
                          <span className="font-mono text-[11px] bg-black/[0.04] text-[#1D1D1F] px-2 py-0.5 rounded-md">
                            #/f/{funnel.slug}
                          </span>
                          <button
                            onClick={() => handleCopyLink(funnel.slug, funnel.id)}
                            className="inline-flex items-center gap-1 text-[11px] text-[#0071E3] hover:underline font-medium"
                          >
                            {copiedId === funnel.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span className="text-emerald-600">Copiado</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copiar</span>
                              </>
                            )}
                          </button>
                          <a
                            href={`#/f/${funnel.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-[#86868B] hover:text-[#1D1D1F]"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Abrir</span>
                          </a>
                        </div>
                      </div>

                      {/* Métricas e Ações */}
                      <div className="flex items-center gap-5 text-xs shrink-0 pt-2 md:pt-0">
                        <div className="text-center">
                          <span className="block font-semibold text-[#1D1D1F] text-sm">{m.views}</span>
                          <span className="text-[10px] text-[#86868B]">Acessos</span>
                        </div>
                        <div className="text-center">
                          <span className="block font-semibold text-[#34C759] text-sm">{m.qualified}</span>
                          <span className="text-[10px] text-[#86868B]">Qualificados</span>
                        </div>
                        <div className="text-center">
                          <span className="block font-semibold text-[#0071E3] text-sm">{m.rate}%</span>
                          <span className="text-[10px] text-[#86868B]">Conversão</span>
                        </div>

                        {/* Botões de Respostas na Tela & Planilha */}
                        {canViewSubmissions && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setViewingSubmissionsFunnel(funnel);
                                setSubmissionSearch('');
                                setSubFilter('all');
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0071E3] bg-[#0071E3]/10 hover:bg-[#0071E3]/20 rounded-full transition-colors shadow-sm"
                              title="Ver respostas e dados dos leads na tela sem precisar baixar planilha"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Ver Respostas ({subCount})</span>
                            </button>

                            <button
                              onClick={() => handleExportSpreadsheet(funnel.id, funnel.design?.headline)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-full transition-colors"
                              title="Baixar planilha CSV / Excel deste formulário"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>CSV</span>
                            </button>
                          </div>
                        )}

                        {/* Ações */}
                        {canEditFunnels && (
                          <div className="flex items-center gap-1 pl-1">
                            <button
                              onClick={() => onEditFunnel(funnel.id)}
                              className="p-2 text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/[0.04] rounded-full transition-colors"
                              title="Editar"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDuplicate(funnel.id)}
                              className="p-2 text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/[0.04] rounded-full transition-colors"
                              title="Duplicar"
                            >
                              <CopyPlus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteFunnel(funnel.id, funnel.design?.headline)}
                              className="p-2 text-[#86868B] hover:text-[#FF3B30] hover:bg-rose-50 rounded-full transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* ABA NOVA: PLANILHAS & RESPOSTAS DOS CLIENTES            */}
      {/* ======================================================== */}
      {activeTab === 'submissions' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">
                Planilhas & Respostas dos Clientes
              </h1>
              <p className="text-xs text-[#86868B] mt-0.5">
                Cada formulário armazena suas respostas completas com UTMs e gera planilhas CSV/Excel instantâneas.
              </p>
            </div>

            <button
              onClick={() => handleExportSpreadsheet(selectedFunnelFilter === 'all' ? null : selectedFunnelFilter, 'Todas-as-Respostas')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-full shadow-sm transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Planilha (Excel/CSV)</span>
            </button>
          </div>

          {/* Filtro por Formulário */}
          <div className="apple-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-medium text-[#1D1D1F]">
              <Filter className="w-4 h-4 text-[#86868B]" />
              <span>Filtrar por Formulário:</span>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedFunnelFilter}
                onChange={(e) => setSelectedFunnelFilter(e.target.value)}
                className="px-3.5 py-1.5 text-xs rounded-xl bg-black/[0.04] text-[#1D1D1F] focus:outline-none focus:bg-white"
              >
                <option value="all">Todos os Formulários ({submissions.length} respostas)</option>
                {funnels.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.design?.headline || f.slug}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tabela de Respostas */}
          <div className="apple-card overflow-hidden">
            <div className="px-6 py-4 flex items-center justify-between border-b border-black/[0.04]">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#86868B]">
                Respostas Registradas ({visibleSubmissions.length})
              </h3>
            </div>

            {visibleSubmissions.length === 0 ? (
              <div className="p-12 text-center text-xs text-[#86868B] space-y-2">
                <FileSpreadsheet className="w-8 h-8 mx-auto text-[#86868B]/40 mb-2" />
                <p className="font-medium text-[#1D1D1F]">Nenhuma resposta registrada ainda</p>
                <p>Preencha um dos formulários para ver as respostas aparecerem aqui automaticamente.</p>
              </div>
            ) : (
              <div className="divide-y divide-black/[0.04] overflow-x-auto">
                {visibleSubmissions.map((sub, idx) => (
                  <div key={sub.id || idx} className="p-5 hover:bg-black/[0.015] transition-colors space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${
                            sub.status === 'qualified'
                              ? 'bg-emerald-500/10 text-emerald-800'
                              : 'bg-rose-500/10 text-rose-800'
                          }`}
                        >
                          {sub.status === 'qualified' ? 'QUALIFICADO' : 'DESQUALIFICADO'}
                        </span>
                        <span className="text-xs font-bold text-[#1D1D1F]">
                          {sub.formTitle || 'Formulário'}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#86868B] flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString('pt-BR') : '-'}
                      </span>
                    </div>

                    {/* Respostas em marcadores */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1 text-xs">
                      {(sub.answers || []).map((ans, aIdx) => (
                        <div key={aIdx} className="p-2.5 rounded-xl bg-black/[0.025] space-y-0.5">
                          <span className="text-[10px] text-[#86868B] block truncate font-medium">
                            {ans.question}
                          </span>
                          <span className="font-medium text-[#1D1D1F] block">
                            {Array.isArray(ans.answer) ? ans.answer.join(', ') : ans.answer}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* UTMs Capturadas */}
                    {sub.tracking && (sub.tracking.utm_source || sub.tracking.utm_campaign) && (
                      <div className="flex items-center gap-2 text-[10px] text-[#86868B] pt-1">
                        <span>Origem: <strong className="text-[#1D1D1F]">{sub.tracking.utm_source}</strong></span>
                        {sub.tracking.utm_campaign && (
                          <span>• Campanha: <strong className="text-[#1D1D1F]">{sub.tracking.utm_campaign}</strong></span>
                        )}
                        {sub.tracking.utm_content && (
                          <span>• Conteúdo: <strong className="text-[#1D1D1F]">{sub.tracking.utm_content}</strong></span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card Google Sheets Ao Vivo (Opcional) */}
          <div className="apple-card p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-semibold text-[#1D1D1F]">
                  Alimentar Google Sheets em Tempo Real (Sem Custo)
                </h3>
              </div>
              <button
                onClick={handleCopyGoogleScript}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-[#0071E3] bg-[#0071E3]/10 hover:bg-[#0071E3]/20 rounded-full transition-colors"
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>{copiedScript ? 'Copiado!' : 'Copiar Script Google'}</span>
              </button>
            </div>
            <p className="text-xs text-[#86868B] leading-relaxed">
              Além de baixar a planilha aqui no painel a qualquer momento, você pode conectar o <strong>Google Sheets</strong> diretamente: basta colar o script em <em>Extensões &gt; Apps Script</em> da sua planilha e colocar a URL gerada no campo de <strong>Webhook</strong> do seu formulário. A cada lead preenchido, uma nova linha é criada instantaneamente.
            </p>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ABA 3: GESTÃO DE CLIENTES & VENDA DE ACESSOS (SAAS)      */}
      {/* ======================================================== */}
      {activeTab === 'clients' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">
                Clientes & Licenças de Acesso
              </h1>
              <p className="text-xs text-[#86868B] mt-0.5">
                Crie e gerencie os acessos (e-mail e senha) que você vende para os seus clientes.
              </p>
            </div>
          </div>

          {/* Formulário de Criação de Novo Cliente para Revenda */}
          <div className="apple-card p-6 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#86868B]">
              Cadastrar Novo Cliente (Gerar Login e Senha)
            </h2>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newClient.email || !newClient.passwordInitial) return;
                try {
                  await createClientAccount(newClient);
                  setNewClient({
                    name: '',
                    email: '',
                    passwordInitial: '',
                    whatsapp: '',
                    plan: 'Plano Pro'
                  });
                  showNotification('Cliente cadastrado com sucesso!');
                  const updated = await getClientAccounts();
                  setClients(updated);
                } catch (err) {
                  showNotification(err.message || 'Erro ao criar cliente.', 'error');
                }
              }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3"
            >
              <div>
                <label className="block text-[11px] font-semibold text-[#1D1D1F] mb-1">Nome do Cliente</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João da Silva"
                  value={newClient.name}
                  onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/[0.04] text-xs text-[#1D1D1F] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#1D1D1F] mb-1">E-mail de Acesso</label>
                <input
                  type="email"
                  required
                  placeholder="cliente@empresa.com"
                  value={newClient.email}
                  onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/[0.04] text-xs text-[#1D1D1F] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#1D1D1F] mb-1">Senha Inicial</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Cliente@2025"
                  value={newClient.passwordInitial}
                  onChange={(e) => setNewClient(prev => ({ ...prev, passwordInitial: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/[0.04] text-xs font-mono text-[#1D1D1F] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#1D1D1F] mb-1">Plano / Licença</label>
                <select
                  value={newClient.plan}
                  onChange={(e) => setNewClient(prev => ({ ...prev, plan: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-black/[0.04] text-xs text-[#1D1D1F] focus:bg-white focus:outline-none"
                >
                  <option value="Plano Mensal">Plano Mensal</option>
                  <option value="Plano Anual">Plano Anual</option>
                  <option value="Acesso Vitalício">Acesso Vitalício</option>
                  <option value="Plano Teste (7 dias)">Plano Teste (7 dias)</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2 px-4 bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
                >
                  Gerar Acesso
                </button>
              </div>
            </form>
          </div>

          {/* Lista de Clientes com Botão de Copiar Dados para WhatsApp */}
          <div className="apple-card overflow-hidden">
            <div className="px-6 py-4 flex items-center justify-between border-b border-black/[0.04]">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#86868B]">
                Clientes Cadastrados ({clients.length})
              </h3>
            </div>

            {clients.length === 0 ? (
              <div className="p-12 text-center text-xs text-[#86868B]">
                Nenhum cliente cadastrado ainda. Use o formulário acima para gerar o primeiro acesso.
              </div>
            ) : (
              <div className="divide-y divide-black/[0.04]">
                {clients.map((c) => {
                  const accessUrl = window.location.origin + window.location.pathname + '#/admin';
                  const whatsappMessage = `Olá ${c.name}! Segue o seu acesso exclusivo ao sistema de funis:\n\n🔗 Link: ${accessUrl}\n📧 E-mail: ${c.email}\n🔑 Senha: ${c.passwordInitial}\n\nVocê já pode acessar e criar seus formulários!`;

                  return (
                    <div key={c.id} className="p-5 hover:bg-black/[0.015] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[#1D1D1F]">{c.name}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            c.status === 'active' ? 'bg-emerald-500/10 text-emerald-800' : 'bg-rose-500/10 text-rose-800'
                          }`}>
                            {c.status === 'active' ? 'ATIVO' : 'SUSPENSO'}
                          </span>
                          <span className="text-[10px] bg-black/[0.04] text-[#86868B] px-2 py-0.5 rounded-md">
                            {c.plan}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-[#86868B] font-mono">
                          <span>Login: <strong className="text-[#1D1D1F]">{c.email}</strong></span>
                          <span>Senha: <strong className="text-[#1D1D1F]">{c.passwordInitial}</strong></span>
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(whatsappMessage);
                            showNotification('Mensagem com dados de acesso copiada para o WhatsApp!');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] rounded-full transition-colors"
                          title="Copiar mensagem com link, login e senha prontos para enviar ao cliente"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar Acesso (WhatsApp)</span>
                        </button>

                        <button
                          onClick={async () => {
                            await toggleClientStatus(c.id, c.status);
                            const updated = await getClientAccounts();
                            setClients(updated);
                            showNotification('Status do cliente atualizado.');
                          }}
                          className="px-2.5 py-1.5 text-xs text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/[0.04] rounded-lg transition-colors"
                        >
                          {c.status === 'active' ? 'Suspender' : 'Reativar'}
                        </button>

                        <button
                          onClick={async () => {
                            if (!window.confirm(`Excluir o cliente ${c.name}?`)) return;
                            await deleteClientAccount(c.id, c.email);
                            const updated = await getClientAccounts();
                            setClients(updated);
                            showNotification('Cliente excluído.');
                          }}
                          className="p-1.5 text-[#86868B] hover:text-[#FF3B30] hover:bg-rose-50 rounded-lg transition-colors"
                          title="Excluir cliente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ABA: USUÁRIOS & PERMISSÕES                               */}
      {/* ======================================================== */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">
                Usuários & Permissões
              </h1>
              <p className="text-xs text-[#86868B] mt-0.5">
                Controle quem tem acesso ao painel e defina permissões para ver funis, criar novos funis, editar e exportar planilhas.
              </p>
            </div>
          </div>

          {/* Card: Cadastrar Novo Usuário com Permissões */}
          <div className="apple-card p-6 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#86868B] flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-[#0071E3]" />
              <span>Adicionar Membro & Definir Permissões</span>
            </h2>

            <form onSubmit={handleCreateUserWithPerms} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#1D1D1F] mb-1">Nome / Função</label>
                  <input
                    type="text"
                    placeholder="Ex: Gestor de Tráfego / Atendente"
                    value={newUser.name}
                    onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/[0.04] text-xs text-[#1D1D1F] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#1D1D1F] mb-1">E-mail do Usuário *</label>
                  <input
                    type="email"
                    required
                    placeholder="membro@empresa.com"
                    value={newUser.email}
                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/[0.04] text-xs text-[#1D1D1F] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Checkboxes de Permissões */}
              <div className="p-4 rounded-2xl bg-black/[0.025] space-y-2">
                <span className="text-[11px] font-semibold text-[#1D1D1F] block mb-1">
                  Permissões de Acesso do Usuário:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white shadow-sm cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={newUser.canViewFunnels}
                      onChange={(e) => setNewUser(prev => ({ ...prev, canViewFunnels: e.target.checked }))}
                      className="rounded text-[#0071E3] focus:ring-0"
                    />
                    <div className="text-xs">
                      <span className="font-semibold text-[#1D1D1F] block">Ver meus funis</span>
                      <span className="text-[10px] text-[#86868B]">Acessar lista e métricas</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white shadow-sm cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={newUser.canCreateFunnels}
                      onChange={(e) => setNewUser(prev => ({ ...prev, canCreateFunnels: e.target.checked }))}
                      className="rounded text-[#0071E3] focus:ring-0"
                    />
                    <div className="text-xs">
                      <span className="font-semibold text-[#1D1D1F] block">Criar funil</span>
                      <span className="text-[10px] text-[#86868B]">Criar novos e duplicar</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white shadow-sm cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={newUser.canEditFunnels}
                      onChange={(e) => setNewUser(prev => ({ ...prev, canEditFunnels: e.target.checked }))}
                      className="rounded text-[#0071E3] focus:ring-0"
                    />
                    <div className="text-xs">
                      <span className="font-semibold text-[#1D1D1F] block">Editar & Excluir</span>
                      <span className="text-[10px] text-[#86868B]">Alterar perguntas</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white shadow-sm cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={newUser.canViewSubmissions}
                      onChange={(e) => setNewUser(prev => ({ ...prev, canViewSubmissions: e.target.checked }))}
                      className="rounded text-[#0071E3] focus:ring-0"
                    />
                    <div className="text-xs">
                      <span className="font-semibold text-[#1D1D1F] block">Ver Planilhas</span>
                      <span className="text-[10px] text-[#86868B]">Baixar leads em CSV</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold rounded-full shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Autorizar Usuário</span>
                </button>
              </div>
            </form>
          </div>

          {/* Lista de Usuários Autorizados */}
          <div className="apple-card overflow-hidden">
            <div className="px-6 py-4 flex items-center justify-between border-b border-black/[0.04]">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#86868B]">
                Equipe & Usuários Autorizados ({authorizedUsers.length + 1})
              </h3>
            </div>

            <div className="divide-y divide-black/[0.04]">
              {/* PROPRIETÁRIO MASTER (SEMPRE NO TOPO) */}
              <div className="p-5 bg-blue-500/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-[#1D1D1F]">Proprietário Master</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0071E3]/15 text-[#0071E3] tracking-wide">
                      PROPRIETÁRIO (ACESSO TOTAL)
                    </span>
                    <span className="text-[10px] text-[#86868B] font-mono">CPF: ***.***.283-19</span>
                  </div>
                  <p className="text-xs text-[#86868B] font-mono">
                    johnrenneradm@gmail.com
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap text-[11px] font-semibold text-emerald-700">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Ver Funis
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Criar Funil
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Editar Funil
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Ver Planilhas
                  </span>
                </div>
              </div>

              {/* DEMAIS USUÁRIOS */}
              {authorizedUsers
                .filter(u => u.email !== 'johnrenneradm@gmail.com')
                .map((u) => {
                  const perms = u.permissions || {
                    canViewFunnels: true,
                    canCreateFunnels: true,
                    canEditFunnels: true,
                    canViewSubmissions: true
                  };

                  return (
                    <div key={u.email} className="p-5 hover:bg-black/[0.015] transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[#1D1D1F]">{u.name || u.email.split('@')[0]}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/[0.05] text-[#86868B]">
                            {u.role || 'Membro'}
                          </span>
                        </div>
                        <p className="text-xs text-[#86868B] font-mono">{u.email}</p>
                      </div>

                      {/* Permissões Interativas (Clique para Alternar) */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleToggleUserPermission(u.email, 'canViewFunnels', perms.canViewFunnels)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all flex items-center gap-1 ${
                            perms.canViewFunnels !== false
                              ? 'bg-emerald-500/10 text-emerald-800 hover:bg-emerald-500/20'
                              : 'bg-black/[0.04] text-[#86868B] hover:bg-black/[0.08]'
                          }`}
                          title="Clique para ativar/desativar permissão de ver funis"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Ver Funis: {perms.canViewFunnels !== false ? 'SIM' : 'NÃO'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleUserPermission(u.email, 'canCreateFunnels', perms.canCreateFunnels)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all flex items-center gap-1 ${
                            perms.canCreateFunnels !== false
                              ? 'bg-blue-500/10 text-blue-800 hover:bg-blue-500/20'
                              : 'bg-black/[0.04] text-[#86868B] hover:bg-black/[0.08]'
                          }`}
                          title="Clique para ativar/desativar permissão de criar funis"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Criar Funil: {perms.canCreateFunnels !== false ? 'SIM' : 'NÃO'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleUserPermission(u.email, 'canEditFunnels', perms.canEditFunnels)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all flex items-center gap-1 ${
                            perms.canEditFunnels !== false
                              ? 'bg-indigo-500/10 text-indigo-800 hover:bg-indigo-500/20'
                              : 'bg-black/[0.04] text-[#86868B] hover:bg-black/[0.08]'
                          }`}
                          title="Clique para ativar/desativar permissão de editar funis"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Editar: {perms.canEditFunnels !== false ? 'SIM' : 'NÃO'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleUserPermission(u.email, 'canViewSubmissions', perms.canViewSubmissions)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all flex items-center gap-1 ${
                            perms.canViewSubmissions !== false
                              ? 'bg-emerald-500/10 text-emerald-800 hover:bg-emerald-500/20'
                              : 'bg-black/[0.04] text-[#86868B] hover:bg-black/[0.08]'
                          }`}
                          title="Clique para ativar/desativar permissão de ver e baixar planilhas"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          <span>Planilhas: {perms.canViewSubmissions !== false ? 'SIM' : 'NÃO'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoveUser(u.email)}
                          className="p-1.5 text-[#86868B] hover:text-[#FF3B30] hover:bg-rose-50 rounded-lg transition-colors ml-2"
                          title="Revogar acesso deste usuário"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ABA 4: SEGURANÇA & DEPLOY                                */}
      {/* ======================================================== */}
      {activeTab === 'security' && (
        <div className="max-w-2xl mx-auto space-y-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">
              Segurança & Hospedagem
            </h1>
            <p className="text-xs text-[#86868B] mt-0.5">
              Arquitetura estática segura no GitHub Pages com backend Firebase Spark gratuito.
            </p>
          </div>

          <div className="apple-card p-6 space-y-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#0071E3]">
              1. Regras do Firestore
            </span>
            <h3 className="text-sm font-semibold text-[#1D1D1F]">Validação Server-Side Zero-Trust</h3>
            <p className="text-xs text-[#86868B] leading-relaxed">
              O arquivo <code className="font-mono text-[#1D1D1F] bg-black/[0.05] px-1.5 py-0.5 rounded">firestore.rules</code> protege a coleção <code className="font-mono">form_submissions</code>: qualquer visitante pode enviar uma resposta legítima, mas apenas administradores autenticados podem ler ou baixar as planilhas.
            </p>
          </div>

          <div className="apple-card p-6 space-y-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#0071E3]">
              2. GitHub Actions
            </span>
            <h3 className="text-sm font-semibold text-[#1D1D1F]">Deploy Seguro Sem Credenciais no Código</h3>
            <p className="text-xs text-[#86868B] leading-relaxed">
              O workflow em <code className="font-mono text-[#1D1D1F] bg-black/[0.05] px-1.5 py-0.5 rounded">.github/workflows/deploy.yml</code> lê as variáveis diretamente dos <strong>GitHub Secrets</strong>.
            </p>
          </div>

          <div className="apple-card p-6 space-y-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#0071E3]">
              3. Restrição de Domínio
            </span>
            <h3 className="text-sm font-semibold text-[#1D1D1F]">Blindagem da Chave de API</h3>
            <p className="text-xs text-[#86868B] leading-relaxed">
              No Google Cloud Console, a chave de API pode ser restrita apenas ao domínio do seu GitHub Pages e localhost.
            </p>
          </div>
        </div>
      )}

      {/* MODAL VER RESPOSTAS NA TELA (SEM BAIXAR PLANILHA) */}
      {viewingSubmissionsFunnel && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white max-w-4xl w-full rounded-3xl shadow-2xl p-6 space-y-4 max-h-[90vh] flex flex-col">
            
            {/* Header do Modal */}
            <div className="flex items-center justify-between border-b border-black/[0.05] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-[#1D1D1F]">
                    {viewingSubmissionsFunnel.design?.headline || viewingSubmissionsFunnel.slug}
                  </h3>
                  <span className="text-[10px] bg-black/[0.04] text-[#86868B] px-2 py-0.5 rounded-full font-mono">
                    /{viewingSubmissionsFunnel.slug}
                  </span>
                </div>
                <p className="text-xs text-[#86868B] mt-0.5">
                  Visualização de respostas em tempo real diretamente na tela.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleExportSpreadsheet(viewingSubmissionsFunnel.id, viewingSubmissionsFunnel.design?.headline)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 rounded-full transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Planilha CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewingSubmissionsFunnel(null)}
                  className="p-1.5 text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/[0.05] rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Barra de Filtros e Busca */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center apple-segmented-bg p-0.5">
                <button
                  type="button"
                  onClick={() => setSubFilter('all')}
                  className={`px-3 py-1 text-xs apple-segmented-item ${subFilter === 'all' ? 'apple-segmented-item-active' : 'text-[#86868B]'}`}
                >
                  Todas ({submissions.filter(s => s.formId === viewingSubmissionsFunnel.id).length})
                </button>
                <button
                  type="button"
                  onClick={() => setSubFilter('qualified')}
                  className={`px-3 py-1 text-xs apple-segmented-item ${subFilter === 'qualified' ? 'apple-segmented-item-active' : 'text-[#86868B]'}`}
                >
                  Qualificados ({submissions.filter(s => s.formId === viewingSubmissionsFunnel.id && s.status === 'qualified').length})
                </button>
                <button
                  type="button"
                  onClick={() => setSubFilter('disqualified')}
                  className={`px-3 py-1 text-xs apple-segmented-item ${subFilter === 'disqualified' ? 'apple-segmented-item-active' : 'text-[#86868B]'}`}
                >
                  Desqualificados ({submissions.filter(s => s.formId === viewingSubmissionsFunnel.id && s.status === 'disqualified').length})
                </button>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#86868B] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar nas respostas..."
                  value={submissionSearch}
                  onChange={(e) => setSubmissionSearch(e.target.value)}
                  className="pl-8 pr-3 py-1 text-xs rounded-full bg-black/[0.04] text-[#1D1D1F] focus:bg-white focus:outline-none w-48 sm:w-56"
                />
              </div>
            </div>

            {/* Lista com Rolagem */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {(() => {
                const funnelSubs = submissions
                  .filter(s => s.formId === viewingSubmissionsFunnel.id)
                  .filter(s => subFilter === 'all' ? true : s.status === subFilter)
                  .filter(s => {
                    if (!submissionSearch.trim()) return true;
                    const search = submissionSearch.toLowerCase();
                    return (s.answers || []).some(a => 
                      (a.question && a.question.toLowerCase().includes(search)) ||
                      (a.answer && String(a.answer).toLowerCase().includes(search))
                    );
                  });

                if (funnelSubs.length === 0) {
                  return (
                    <div className="py-12 text-center text-xs text-[#86868B]">
                      Nenhuma resposta encontrada para os filtros selecionados.
                    </div>
                  );
                }

                return funnelSubs.map((sub, sIdx) => {
                  return (
                    <div key={sub.id || sIdx} className="p-4 rounded-2xl bg-black/[0.025] space-y-3 border border-black/[0.03]">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            sub.status === 'qualified'
                              ? 'bg-emerald-500/10 text-emerald-800'
                              : 'bg-amber-500/10 text-amber-800'
                          }`}>
                            {sub.status === 'qualified' ? 'QUALIFICADO' : 'DESQUALIFICADO'}
                          </span>
                          <span className="text-[11px] text-[#86868B] flex items-center gap-1 font-mono">
                            <Calendar className="w-3 h-3" />
                            {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString('pt-BR') : '-'}
                          </span>
                        </div>

                        {sub.tracking && (sub.tracking.utm_source || sub.tracking.utm_campaign) && (
                          <div className="text-[10px] text-[#86868B] font-mono">
                            <span>Origem: <strong className="text-[#1D1D1F]">{sub.tracking.utm_source || 'Direto'}</strong></span>
                            {sub.tracking.utm_campaign && <span> • Campanha: {sub.tracking.utm_campaign}</span>}
                          </div>
                        )}
                      </div>

                      {/* Respostas em Cards Apple */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                        {(sub.answers || []).map((ans, aIdx) => (
                          <div key={aIdx} className="p-3 rounded-xl bg-white shadow-sm space-y-1">
                            <span className="text-[10px] font-semibold text-[#86868B] block truncate">
                              {ans.question}
                            </span>
                            <span className="font-medium text-[#1D1D1F] block text-xs break-words">
                              {Array.isArray(ans.answer) ? ans.answer.join(', ') : ans.answer}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
