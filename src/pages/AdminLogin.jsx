import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, KeyRound, AlertCircle, CheckCircle2, ArrowRight, Sparkles, UserCheck } from 'lucide-react';
import { loginWithGoogle, loginWithEmail, resetPassword, isFirebaseConfigured, MASTER_CPF } from '../services/firebase';

export default function AdminLogin({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [error, setError] = useState('');
  const [forgotMode, setForgotMode] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // 1. Login do Proprietário Master via Google
  const handleGoogleLogin = async () => {
    try {
      setLoadingGoogle(true);
      setError('');
      const user = await loginWithGoogle();
      if (user) {
        onLoginSuccess(user);
      }
    } catch (err) {
      console.error(err);
      setError('Falha ao autenticar com Google: ' + (err.message || 'Verifique se o provedor Google está ativado no Firebase Authentication.'));
    } finally {
      setLoadingGoogle(false);
    }
  };

  // 2. Login de Clientes / Usuários Licenciados via E-mail e Senha
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setLoadingEmail(true);
      setError('');
      const user = await loginWithEmail(email, password);
      if (user) {
        onLoginSuccess(user);
      }
    } catch (err) {
      setError(err.message || 'E-mail ou senha incorretos, ou usuário não cadastrado.');
    } finally {
      setLoadingEmail(false);
    }
  };

  // 3. Recuperação de Senha
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Digite o seu e-mail para receber o link de redefinição.');
      return;
    }
    try {
      setLoadingEmail(true);
      setError('');
      await resetPassword(email);
      setSuccessMessage('E-mail de redefinição de senha enviado com sucesso! Verifique sua caixa de entrada.');
      setTimeout(() => setForgotMode(false), 4000);
    } catch (err) {
      setError(err.message || 'Erro ao enviar e-mail de redefinição.');
    } finally {
      setLoadingEmail(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 animate-fade-in font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#1D1D1F] mx-auto flex items-center justify-center text-white shadow-sm mb-3">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-[#1D1D1F]">
          Painel Administrativo
        </h2>
        <p className="mt-0.5 text-xs text-[#86868B]">
          Acesso Master (Proprietário) & Clientes Licenciados
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="apple-card p-8 space-y-6">
          
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* ACESSO 1: PROPRIETÁRIO MASTER (GOOGLE) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0071E3] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Acesso Master (Proprietário)</span>
              </span>
              <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-mono font-medium">
                CPF: ***.***.283-19
              </span>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loadingGoogle}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white hover:bg-slate-50 text-[#1D1D1F] text-xs font-semibold shadow-sm border border-black/[0.08] hover:shadow transition-all active:scale-[0.99] disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{loadingGoogle ? 'Conectando ao Google...' : 'Entrar com Google (Proprietário)'}</span>
            </button>
          </div>

          {/* Divisor Apple Minimalista */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-black/[0.06]"></div>
            <span className="flex-shrink mx-3 text-[10px] uppercase tracking-wider font-semibold text-[#86868B]">
              ou clientes cadastrados por você
            </span>
            <div className="flex-grow border-t border-black/[0.06]"></div>
          </div>

          {/* ACESSO 2: CLIENTES / USUÁRIOS REVENDIDOS (E-MAIL E SENHA) */}
          {!forgotMode ? (
            <form onSubmit={handleEmailLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                  E-mail do Cliente / Usuário
                </label>
                <input
                  type="email"
                  placeholder="cliente@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/[0.04] text-xs text-[#1D1D1F] focus:bg-white focus:ring-2 focus:ring-[#0071E3]/20 focus:outline-none transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[#1D1D1F]">
                    Senha de Acesso
                  </label>
                  <button
                    type="button"
                    onClick={() => { setForgotMode(true); setError(''); }}
                    className="text-[11px] text-[#0071E3] hover:underline"
                  >
                    Esqueceu?
                  </button>
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/[0.04] text-xs text-[#1D1D1F] focus:bg-white focus:ring-2 focus:ring-[#0071E3]/20 focus:outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loadingEmail}
                className="w-full py-2.5 px-4 rounded-xl bg-[#1D1D1F] hover:bg-black text-white text-xs font-semibold shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <span>{loadingEmail ? 'Verificando...' : 'Acessar com E-mail e Senha'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                  E-mail para Redefinição
                </label>
                <input
                  type="email"
                  required
                  placeholder="seu-email@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/[0.04] text-xs text-[#1D1D1F] focus:bg-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loadingEmail}
                className="w-full py-2.5 px-4 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold shadow-sm transition-all"
              >
                {loadingEmail ? 'Enviando...' : 'Enviar Link de Redefinição'}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setForgotMode(false)}
                  className="text-xs text-[#86868B] hover:text-[#1D1D1F]"
                >
                  Voltar ao login
                </button>
              </div>
            </form>
          )}

          {/* Rodapé de Informação de Licenciamento */}
          <div className="pt-3 border-t border-black/[0.04] space-y-1.5 text-[11px] text-[#86868B]">
            <p className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Somente você (Proprietário) tem permissão de revenda e gestão master.</span>
            </p>
            <p className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Clientes terceiros só entram se você cadastrá-los na aba &quot;Acessos&quot;.</span>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
