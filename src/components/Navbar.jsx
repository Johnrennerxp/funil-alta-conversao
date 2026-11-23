import React from 'react';
import { Layers, FileSpreadsheet, Users, Lock, LogOut, ShieldCheck, Sparkles } from 'lucide-react';
import { isFirebaseConfigured, logoutUser } from '../services/firebase';

export default function Navbar({ activeTab, setActiveTab, user, onLoginClick }) {
  return (
    <header className="sticky top-0 z-40 apple-blur border-b border-black/[0.04]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          
          {/* Logo Minimalista Apple */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#1D1D1F] flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-[#1D1D1F] tracking-tight text-sm">LeadFunnel</span>
                <span className="px-1.5 py-0.5 text-[9px] font-medium tracking-wide bg-black/[0.05] text-[#86868B] rounded-md">
                  PRO
                </span>
              </div>
            </div>
          </div>

          {/* Segmented Control Central no estilo macOS */}
          {user && (
            <nav className="flex items-center apple-segmented-bg">
              <button
                onClick={() => setActiveTab('funnels')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs apple-segmented-item ${
                  activeTab === 'funnels'
                    ? 'apple-segmented-item-active'
                    : 'text-[#86868B] hover:text-[#1D1D1F]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Funis</span>
              </button>

              <button
                onClick={() => setActiveTab('submissions')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs apple-segmented-item ${
                  activeTab === 'submissions'
                    ? 'apple-segmented-item-active'
                    : 'text-[#86868B] hover:text-[#1D1D1F]'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Planilhas</span>
              </button>

              <button
                onClick={() => setActiveTab('users')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs apple-segmented-item ${
                  activeTab === 'users'
                    ? 'apple-segmented-item-active'
                    : 'text-[#86868B] hover:text-[#1D1D1F]'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Acessos</span>
              </button>

              <button
                onClick={() => setActiveTab('security')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs apple-segmented-item ${
                  activeTab === 'security'
                    ? 'apple-segmented-item-active'
                    : 'text-[#86868B] hover:text-[#1D1D1F]'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Segurança</span>
              </button>
            </nav>
          )}

          {/* Right Action & Status */}
          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center">
              {isFirebaseConfigured ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-emerald-800 bg-emerald-500/10 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Nuvem
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-[#86868B] bg-black/[0.04] rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  Local
                </span>
              )}
            </div>

            {user ? (
              <div className="flex items-center gap-2">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || user.email}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-black/[0.06] text-[#1D1D1F] font-semibold flex items-center justify-center text-xs">
                    {(user.email || 'A')[0].toUpperCase()}
                  </div>
                )}

                <button
                  onClick={async () => {
                    await logoutUser();
                    window.location.reload();
                  }}
                  title="Sair"
                  className="p-1.5 text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/[0.04] rounded-lg transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onLoginClick}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-white bg-[#0071E3] hover:bg-[#0077ED] rounded-full transition-all shadow-sm"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Entrar</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
