import React, { useState, useEffect, lazy, Suspense } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { subscribeToAuth } from './services/firebase';

const PublicFunnel = lazy(() => import('./pages/PublicFunnel'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const FunnelEditor = lazy(() => import('./pages/FunnelEditor'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const Navbar = lazy(() => import('./components/Navbar'));

function FallbackLoader() {
  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center text-xs text-[#86868B]">
      <div className="flex flex-col items-center gap-2">
        <div className="w-5 h-5 border-2 border-[#0071E3] border-t-transparent rounded-full animate-spin"></div>
        <span>Carregando...</span>
      </div>
    </div>
  );
}

function AdminWrapper() {
  const [activeTab, setActiveTab] = useState('funnels');
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [editingFunnelId, setEditingFunnelId] = useState(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToAuth((currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center text-xs text-[#86868B]">
        Verificando permissões...
      </div>
    );
  }

  if (!user) {
    return (
      <Suspense fallback={<FallbackLoader />}>
        <AdminLogin onLoginSuccess={(u) => setUser(u)} />
      </Suspense>
    );
  }

  if (editingFunnelId || isCreatingNew) {
    return (
      <Suspense fallback={<FallbackLoader />}>
        <FunnelEditor
          funnelId={editingFunnelId}
          onBack={() => {
            setEditingFunnelId(null);
            setIsCreatingNew(false);
          }}
        />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <Suspense fallback={<FallbackLoader />}>
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          user={user}
          onLoginClick={() => {}}
        />
        <AdminDashboard
          activeTab={activeTab}
          user={user}
          onEditFunnel={(id) => setEditingFunnelId(id)}
          onCreateNew={() => setIsCreatingNew(true)}
        />
      </Suspense>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Suspense fallback={<FallbackLoader />}>
        <Routes>
          <Route path="/f/:slug" element={<PublicFunnel />} />
          <Route path="/admin/*" element={<AdminWrapper />} />
          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
