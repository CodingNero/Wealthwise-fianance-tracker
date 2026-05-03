import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

let toastId = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = ++toastId;
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(t => t.filter(x => x.id !== id));
  }, []);

  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
    warning: (msg) => addToast(msg, 'warning'),
    info: (msg) => addToast(msg, 'info'),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

const ICONS = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
const COLORS = {
  success: { bg: 'var(--green-bg)', border: 'rgba(52,211,153,0.25)', color: 'var(--green)' },
  error:   { bg: 'var(--red-bg)',   border: 'rgba(248,113,113,0.25)', color: 'var(--red)' },
  warning: { bg: 'var(--yellow-bg)',border: 'rgba(251,191,36,0.25)',  color: 'var(--yellow)' },
  info:    { bg: 'var(--blue-bg)',  border: 'rgba(96,165,250,0.25)',  color: 'var(--blue)' },
};

function ToastContainer({ toasts, onRemove }) {
  if (!toasts.length) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 360,
    }}>
      {toasts.map(t => {
        const c = COLORS[t.type] || COLORS.info;
        return (
          <div
            key={t.id}
            onClick={() => onRemove(t.id)}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              background: 'var(--bg-card)',
              border: `1px solid ${c.border}`,
              borderLeft: `3px solid ${c.color}`,
              borderRadius: 12,
              padding: '12px 14px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              cursor: 'pointer',
              animation: 'toastIn 0.3s cubic-bezier(0.4,0,0.2,1)',
              backdropFilter: 'blur(8px)',
              minWidth: 260,
            }}
          >
            <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{ICONS[t.type]}</span>
            <span style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5, flex: 1 }}>{t.message}</span>
            <span style={{ fontSize: 16, color: 'var(--text-muted)', flexShrink: 0, lineHeight: 1 }}>×</span>
          </div>
        );
      })}
    </div>
  );
}
