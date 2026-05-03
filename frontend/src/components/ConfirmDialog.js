import React from 'react';

/**
 * Usage:
 * <ConfirmDialog
 *   open={open}
 *   title="Delete Transaction"
 *   message="Are you sure? This cannot be undone."
 *   confirmLabel="Delete"
 *   danger
 *   onConfirm={handleConfirm}
 *   onCancel={() => setOpen(false)}
 * />
 */
export default function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', danger = false, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="modal" style={{ maxWidth: 380 }}>
        <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>{danger ? '🗑️' : '❓'}</div>
          <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 8 }}>{title}</h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{message}</p>
        </div>
        <div className="modal-footer" style={{ justifyContent: 'center', gap: 12 }}>
          <button className="btn btn-secondary" onClick={onCancel} style={{ minWidth: 100 }}>Cancel</button>
          <button
            className={danger ? 'btn btn-danger' : 'btn btn-primary'}
            onClick={onConfirm}
            style={{ minWidth: 100 }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
