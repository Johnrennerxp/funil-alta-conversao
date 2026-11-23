import React from 'react';
import { Layers, Users, FileSpreadsheet, Lock, LogOut, Sparkles } from 'lucide-react';
import { isFirebaseConfigured, logoutUser } from '../services/firebase';

export default function Navbar({ activeTab, setActiveTab, user, onLoginClick }) {
  return (
    <header className="sticky top-0 z-40 apple-blur border-b border-black/[0.04]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          
          {/* Logo Minimalista */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#1D1D1F] flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-semibold text-[#1D1D1F] tracking-tight text-sm">LeadFunnel</span>
            </div>
          </div>

          {/* Segmented Control no estilo macOS */}
          {user && (
            <nav className="flex items-center apple-segmented-bg">
              <button
                onClick={() => setActiveTab('funnels')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs apple-segmented-item ${
                  activeTab === 'funnels' ? 'apple-segmented-item-active' : 'text-[#86868B] hover:text-[#1D1D1F]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Funis</span>
              </button>

              <button
                onClick={() => setActiveTab('clients')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs apple-segmented-item ${
                  activeTab === 'clients' ? 'apple-segmented-item-active' : 'text-[#86868B] hover:text-[#1D1D1F]'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>Clientes & Vendas</span>
              </button>

              <button
                onClick={() => setActiveTab('submissions')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs apple-segmented-item ${
                  activeTab === 'submissions' ? 'apple-segmented-item-active' : 'text-[#86868B] hover:text-[#1D1D1F]'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Planilhas</span>
              </button>

              <button
                onClick={() => setActiveTab('security')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs apple-segmented-item ${
                  activeTab === 'security' ? 'apple-segmented-item-active' : 'text-[#86868B] hover:text-[#1D1D1F]'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Segurança</span>
              </button>
            </nav>
          )}

          {/* Right Action */}
          <div className="flex items-center gap-2.5">
            {user && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-[#1D1D1F] hidden sm:inline max-w-[140px] truncate">
                  {user.email}
                </span>

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
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
