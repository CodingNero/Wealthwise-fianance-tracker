import React, { useState, useEffect, useCallback } from 'react';
import { getBudgets, createBudget, deleteBudget } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency, CATEGORIES, CATEGORY_ICONS, CATEGORY_COLORS, getCurrentMonthYear, getMonthLabel } from '../utils/helpers';
import ConfirmDialog from '../components/ConfirmDialog';
import { SkeletonStatCard } from '../components/Skeleton';

const PALETTE = ['#7c6af7','#34d399','#f87171','#60a5fa','#fbbf24','#fb923c','#a78bfa','#0ea5e9','#f97316','#94a3b8'];
const EMPTY_FORM = { category: 'Food', limit: '', period: 'monthly', alertThreshold: 80, color: '#7c6af7' };

export default function Budget() {
  const { user } = useAuth();
  const toast = useToast();
  const [monthYear, setMonthYear] = useState(getCurrentMonthYear());
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const currency = user?.currency || 'USD';

  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await getBudgets({ month: monthYear.month, year: monthYear.year }); setBudgets(res.data); }
    catch (e) { toast.error('Failed to load budgets'); }
    finally { setLoading(false); }
  }, [monthYear]);

  useEffect(() => { load(); }, [load]);

  const shiftMonth = dir => setMonthYear(({ month, year }) => {
    let m = month + dir, y = year;
    if (m > 12) { m = 1; y++; } if (m < 1) { m = 12; y--; }
    return { month: m, year: y };
  });

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await createBudget({ ...form, limit: parseFloat(form.limit), alertThreshold: parseInt(form.alertThreshold), month: monthYear.month, year: monthYear.year });
      setShowModal(false); setForm(EMPTY_FORM); load();
      toast.success(`Budget set for ${form.category}`);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save budget'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await deleteBudget(deleteTarget); setDeleteTarget(null); load(); toast.success('Budget removed'); }
    catch (e) { toast.error('Failed to delete budget'); }
  };

  const totalBudget = budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const overBudget = budgets.filter(b => b.isOverBudget).length;
  const usedCats = budgets.map(b => b.category);
  const availableCats = CATEGORIES.filter(c => !usedCats.includes(c));

  return (
    <div>
      <div className="page-header animate-fadeUp">
        <div>
          <h1 className="page-title">Budget</h1>
          <p className="page-subtitle">Set limits · track spending</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="month-selector">
            <button onClick={() => shiftMonth(-1)}>‹</button>
            <span>{getMonthLabel(monthYear.month, monthYear.year)}</span>
            <button onClick={() => shiftMonth(1)}>›</button>
          </div>
          {availableCats.length > 0 && (
            <button className="btn btn-primary" onClick={() => { setForm({ ...EMPTY_FORM, category: availableCats[0] }); setShowModal(true); }}>
              + Add Budget
            </button>
          )}
        </div>
      </div>

      {/* Overview */}
      <div className="stat-grid animate-fadeUp animate-delay-1">
        {loading ? [1,2,3,4].map(i => <SkeletonStatCard key={i} />) : [
          { label: 'Total Budget', value: formatCurrency(totalBudget, currency), icon: '📋', bg: 'var(--blue-bg)' },
          { label: 'Total Spent', value: formatCurrency(totalSpent, currency), icon: '💸', bg: 'var(--red-bg)', color: totalSpent > totalBudget ? 'var(--red)' : null },
          { label: 'Remaining', value: formatCurrency(Math.max(0, totalBudget - totalSpent), currency), icon: '✅', bg: 'var(--green-bg)', color: 'var(--green)' },
          { label: 'Over Budget', value: `${overBudget} ${overBudget === 1 ? 'category' : 'categories'}`, icon: overBudget > 0 ? '⚠️' : '🎯', bg: overBudget > 0 ? 'var(--red-bg)' : 'var(--green-bg)', color: overBudget > 0 ? 'var(--red)' : 'var(--green)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
            <div className="stat-info">
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ color: s.color || 'var(--text-primary)', fontSize: 20 }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Budget cards */}
      {loading ? (
        <div className="grid-2">{[1,2,3,4].map(i => (
          <div key={i} className="budget-card" style={{ minHeight: 120 }}>
            <div style={{ height: 14, width: '60%', background: 'var(--bg-elevated)', borderRadius: 6, marginBottom: 12, animation: 'shimmer 1.4s infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-card-hover) 50%, var(--bg-elevated) 75%)' }} />
            <div style={{ height: 8, width: '100%', background: 'var(--bg-elevated)', borderRadius: 99, animation: 'shimmer 1.4s infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-card-hover) 50%, var(--bg-elevated) 75%)' }} />
          </div>
        ))}</div>
      ) : budgets.length === 0 ? (
        <div className="card animate-fadeUp animate-delay-2">
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No budgets set for this month</h3>
            <p>Create budgets to track your spending limits</p>
            {availableCats.length > 0 && <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => { setForm({ ...EMPTY_FORM, category: availableCats[0] }); setShowModal(true); }}>+ Create First Budget</button>}
          </div>
        </div>
      ) : (
        <div className="grid-2 animate-fadeUp animate-delay-2">
          {budgets.map(b => (
            <div key={b._id} className={`budget-card ${b.isOverBudget ? 'over-budget' : b.isAlertThreshold ? 'near-limit' : ''}`}>
              <div className="budget-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: `${b.color || CATEGORY_COLORS[b.category]}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19 }}>
                    {CATEGORY_ICONS[b.category]}
                  </div>
                  <div>
                    <div className="budget-category">{b.category}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{b.period}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {b.isOverBudget && <span className="badge badge-red">Over</span>}
                  {!b.isOverBudget && b.isAlertThreshold && <span className="badge badge-yellow">Near limit</span>}
                  <span style={{ fontSize: 20, fontWeight: 800, color: b.isOverBudget ? 'var(--red)' : b.isAlertThreshold ? 'var(--yellow)' : 'var(--text-primary)', fontFamily: 'Syne' }}>{b.percentage}%</span>
                  <button className="btn btn-ghost btn-icon" style={{ fontSize: 14 }} onClick={() => setDeleteTarget(b._id)}>🗑️</button>
                </div>
              </div>
              <div className="progress-bar" style={{ height: 10 }}>
                <div className="progress-fill" style={{ width: `${Math.min(100, b.percentage)}%`, background: b.isOverBudget ? 'var(--red)' : b.isAlertThreshold ? 'var(--yellow)' : (b.color || CATEGORY_COLORS[b.category]) }} />
              </div>
              <div className="budget-amounts">
                <span className="budget-spent" style={{ color: b.isOverBudget ? 'var(--red)' : 'var(--text-primary)' }}>Spent: {formatCurrency(b.spent, currency)}</span>
                <span className="budget-limit">Limit: {formatCurrency(b.limit, currency)}</span>
              </div>
              {b.isOverBudget && (
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--red)', background: 'var(--red-bg)', borderRadius: 7, padding: '5px 10px' }}>
                  ⚠️ Over by {formatCurrency(b.spent - b.limit, currency)}
                </div>
              )}
              {!b.isOverBudget && (
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                  {formatCurrency(b.remaining, currency)} remaining
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Set Budget — {getMonthLabel(monthYear.month, monthYear.year)}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" name="category" value={form.category} onChange={handleChange}>
                  {availableCats.map(c => <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>)}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Budget Limit ({currency})</label>
                  <input className="form-input" type="number" name="limit" value={form.limit} onChange={handleChange} placeholder="500" min="0" step="0.01" required autoFocus />
                </div>
                <div className="form-group">
                  <label className="form-label">Period</label>
                  <select className="form-select" name="period" value={form.period} onChange={handleChange}>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Alert threshold — {form.alertThreshold}%</label>
                <input type="range" name="alertThreshold" min="50" max="100" value={form.alertThreshold} onChange={handleChange} style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  <span>50%</span><span>Warn at {form.alertThreshold}%</span><span>100%</span>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Color</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {PALETTE.map(c => (
                    <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                      style={{ width: 30, height: 30, borderRadius: '50%', background: c, border: form.color === c ? '3px solid white' : '2px solid transparent', cursor: 'pointer', boxShadow: form.color === c ? `0 0 0 2px ${c}` : 'none', transition: 'all 0.15s' }} />
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Saving…</> : '💾 Save Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Remove Budget"
        message="This budget will be removed. Your transactions won't be affected."
        confirmLabel="Remove"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
