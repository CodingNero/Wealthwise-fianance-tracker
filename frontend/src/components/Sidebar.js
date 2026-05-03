import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getInitials } from '../utils/helpers';

const NAV_ITEMS = [
  { id: 'dashboard', icon: '🏠', label: 'Dashboard' },
  { id: 'expenses', icon: '💸', label: 'Transactions' },
  { id: 'budget', icon: '📋', label: 'Budget' },
  { id: 'savings', icon: '🎯', label: 'Savings' },
  { id: 'analysis', icon: '📊', label: 'Analysis' },
];

export default function Sidebar({ activePage, onNavigate }) {
  const { user, logoutUser } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close sidebar on navigation (mobile)
  const handleNav = (id) => {
    onNavigate(id);
    setMobileOpen(false);
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (mobileOpen && !e.target.closest('.sidebar') && !e.target.closest('.hamburger')) {
        setMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [mobileOpen]);

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="hamburger"
        onClick={() => setMobileOpen(o => !o)}
        aria-label="Toggle menu"
      >
        <span /><span /><span />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}

      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">💸</div>
          <span>Wealthwise</span>
        </div>

        <div className="nav-section-label">Menu</div>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            className={`nav-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => handleNav(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
            {activePage === item.id && <span className="nav-active-dot" />}
          </button>
        ))}

        <div className="sidebar-bottom">
          <button
            className={`nav-item ${activePage === 'profile' ? 'active' : ''}`}
            onClick={() => handleNav('profile')}
            style={{ marginBottom: 8 }}
          >
            <span className="nav-icon">⚙️</span>
            Settings
          </button>
          <div className="user-card" onClick={() => handleNav('profile')} style={{ cursor: 'pointer' }}>
            <div className="user-avatar">{getInitials(user?.name)}</div>
            <div className="user-info">
              <div className="user-name">{user?.name}</div>
              <div className="user-email">{user?.email}</div>
            </div>
          </div>
          <button
            className="nav-item"
            style={{ marginTop: 6, color: 'var(--text-secondary)', fontSize: 15, fontWeight: 500 }}
            onClick={logoutUser}
          >
            <span className="nav-icon">🚪</span>
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
