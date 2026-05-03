import React, { useState, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Budget from './pages/Budget';
import Savings from './pages/Savings';
import Analysis from './pages/Analysis';
import Profile from './pages/Profile';
import Sidebar from './components/Sidebar';
import './index.css';

const PAGES = { dashboard: Dashboard, expenses: Expenses, budget: Budget, savings: Savings, analysis: Analysis, profile: Profile };

function AppContent() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState('dashboard');
  const [fading, setFading] = useState(false);

  const handleNavigate = (newPage) => {
    if (newPage === page) return;
    setFading(true);
    setTimeout(() => { setPage(newPage); setFading(false); }, 110);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ fontSize: 52, lineHeight: 1 }}>💸</div>
          <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 24, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>Wealthwise</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Personal Finance</div>
        </div>
        <div className="spinner" style={{ width: 24, height: 24, marginTop: 32 }} />
      </div>
    );
  }

  if (!user) return <AuthPage />;
  const PageComponent = PAGES[page] || Dashboard;

  return (
    <div className="app-shell">
      <Sidebar activePage={page} onNavigate={handleNavigate} />
      <main className="main-content" style={{ opacity: fading ? 0 : 1, transition: 'opacity 0.11s ease' }}>
        <PageComponent />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}
