import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import AdminDashboard from './pages/AdminDashboard';
import FunnelEditor from './pages/FunnelEditor';
import AdminLogin from './pages/AdminLogin';
import PublicFunnel from './pages/PublicFunnel';
import { subscribeToAuth } from './services/firebase';

function AdminWrapper() {
  const [activeTab, setActiveTab] = useState('funnels'); // 'funnels' | 'users' | 'security'
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
    return <AdminLogin onLoginSuccess={(u) => setUser(u)} />;
  }

  if (editingFunnelId || isCreatingNew) {
    return (
      <FunnelEditor
        funnelId={editingFunnelId}
        onBack={() => {
          setEditingFunnelId(null);
          setIsCreatingNew(false);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
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
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/f/:slug" element={<PublicFunnel />} />
        <Route path="/admin/*" element={<AdminWrapper />} />
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </Router>
  );
}
