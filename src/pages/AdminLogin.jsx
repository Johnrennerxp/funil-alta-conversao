import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, KeyRound, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { loginWithEmail, registerWithEmail, resetPassword, isFirebaseConfigured } from '../services/firebase';

export default function AdminLogin({ onLoginSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const user = await loginWithEmail(email, password);
        if (user) onLoginSuccess(user);
      } else if (mode === 'register') {
        const user = await registerWithEmail(email, password);
        if (user) onLoginSuccess(user);
      } else if (mode === 'forgot') {
        await resetPassword(email);
        setSuccessMessage('E-mail de redefinição de senha enviado com sucesso! Verifique sua caixa de entrada.');
        setTimeout(() => setMode('login'), 4000);
      }
    } catch (err) {
      setError(err.message || 'Ocorreu um erro ao processar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 animate-fade-in font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#1D1D1F] mx-auto flex items-center justify-center text-white shadow-sm mb-3">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-[#1D1D1F]">
          Painel de Controle
        </h2>
        <p className="mt-0.5 text-xs text-[#86868B]">
          Acesso seguro por e-mail e senha
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="apple-card p-8 space-y-5">
          
          {/* Seletor Segmentado Apple Style (Entrar / Criar Conta) */}
          {mode !== 'forgot' && (
            <div className="flex items-center apple-segmented-bg mb-2">
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); }}
                className={`flex-1 py-1.5 text-xs apple-segmented-item ${
                  mode === 'login' ? 'apple-segmented-item-active' : 'text-[#86868B] hover:text-[#1D1D1F]'
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setError(''); }}
                className={`flex-1 py-1.5 text-xs apple-segmented-item ${
                  mode === 'register' ? 'apple-segmented-item-active' : 'text-[#86868B] hover:text-[#1D1D1F]'
                }`}
              >
                Criar Acesso
              </button>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                E-mail
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  autoFocus
                  placeholder="admin@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/[0.04] text-xs text-[#1D1D1F] focus:bg-white focus:ring-2 focus:ring-[#0071E3]/20 focus:outline-none transition-all placeholder:text-[#86868B]/60"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[#1D1D1F]">
                    Senha
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => { setMode('forgot'); setError(''); }}
                      className="text-[11px] text-[#0071E3] hover:underline"
                    >
                      Esqueceu a senha?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/[0.04] text-xs text-[#1D1D1F] focus:bg-white focus:ring-2 focus:ring-[#0071E3]/20 focus:outline-none transition-all"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <span>
                {loading
                  ? 'Verificando...'
                  : mode === 'login'
                    ? 'Entrar no Painel'
                    : mode === 'register'
                      ? 'Criar Conta de Administrador'
                      : 'Enviar Link de Redefinição'}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {mode === 'forgot' && (
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); }}
                  className="text-xs text-[#86868B] hover:text-[#1D1D1F]"
                >
                  Voltar para o Login
                </button>
              </div>
            )}
          </form>

          <div className="pt-4 border-t border-black/[0.04] space-y-2 text-[11px] text-[#86868B]">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Autenticação Independente (Pronto para Venda/SaaS)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Funciona com qualquer domínio de e-mail</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
