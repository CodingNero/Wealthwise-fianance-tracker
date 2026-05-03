import React, { useState, useEffect, useCallback } from 'react';
import { getSavingsGoals, createSavingsGoal, updateSavingsGoal, deleteSavingsGoal, contributeToGoal } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency, SAVINGS_CATEGORIES, SAVINGS_ICONS } from '../utils/helpers';
import ConfirmDialog from '../components/ConfirmDialog';
import { SkeletonStatCard } from '../components/Skeleton';

const GOAL_COLORS = ['#7c6af7','#34d399','#f87171','#60a5fa','#fbbf24','#fb923c','#a78bfa','#0ea5e9'];
const EMPTY_FORM = { title: '', targetAmount: '', currentAmount: '', category: 'Other', priority: 'medium', color: '#7c6af7', icon: '🎯', deadline: '', notes: '' };
const EMPTY_CONTRIB = { amount: '', note: '' };

const getPriorityColor = p => ({ high: 'var(--red)', medium: 'var(--yellow)', low: 'var(--green)' }[p] || 'var(--text-muted)');

export default function Savings() {
  const { user } = useAuth();
  const toast = useToast();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showContrib, setShowContrib] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [contrib, setContrib] = useState(EMPTY_CONTRIB);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [tab, setTab] = useState('active');
  const currency = user?.currency || 'USD';

  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await getSavingsGoals(); setGoals(res.data); }
    catch (e) { toast.error('Failed to load savings goals'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditItem(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = g => {
    setEditItem(g);
    setForm({ title: g.title, targetAmount: g.targetAmount, currentAmount: g.currentAmount, category: g.category, priority: g.priority, color: g.color, icon: g.icon, deadline: g.deadline ? g.deadline.split('T')[0] : '', notes: g.notes || '' });
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditItem(null); };
  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { ...form, targetAmount: parseFloat(form.targetAmount), currentAmount: parseFloat(form.currentAmount) || 0 };
      if (editItem) { await updateSavingsGoal(editItem._id, payload); toast.success('Goal updated'); }
      else { await createSavingsGoal(payload); toast.success('Savings goal created! 🎯'); }
      closeModal(); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save goal'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await deleteSavingsGoal(deleteTarget); setDeleteTarget(null); load(); toast.success('Goal deleted'); }
    catch (e) { toast.error('Failed to delete goal'); }
  };

  const handleContribute = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await contributeToGoal(showContrib, { amount: parseFloat(contrib.amount), note: contrib.note });
      const goal = goals.find(g => g._id === showContrib);
      const newAmt = (goal?.currentAmount || 0) + parseFloat(contrib.amount);
      if (goal && newAmt >= goal.targetAmount) toast.success('🏆 Goal completed! Congratulations!');
      else toast.success(`Added ${formatCurrency(parseFloat(contrib.amount), currency)} to goal`);
      setShowContrib(null); setContrib(EMPTY_CONTRIB); load();
    } catch (err) { toast.error('Failed to add contribution'); }
    finally { setSaving(false); }
  };

  const getDaysLeft = deadline => {
    if (!deadline) return null;
    return Math.ceil((new Date(deadline) - new Date()) / 86400000);
  };

  const filtered = goals.filter(g => tab === 'active' ? !g.isCompleted : g.isCompleted);
  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const completed = goals.filter(g => g.isCompleted).length;

  return (
    <div>
      <div className="page-header animate-fadeUp">
        <div>
          <h1 className="page-title">Savings Goals</h1>
          <p className="page-subtitle">Track your financial milestones</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ New Goal</button>
      </div>

      <div className="stat-grid animate-fadeUp animate-delay-1">
        {loading ? [1,2,3,4].map(i => <SkeletonStatCard key={i} />) : [
          { label: 'Total Saved', value: formatCurrency(totalSaved, currency), icon: '💰', bg: 'var(--green-bg)' },
          { label: 'Total Target', value: formatCurrency(totalTarget, currency), icon: '🎯', bg: 'var(--blue-bg)' },
          { label: 'Overall Progress', value: `${totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0}%`, icon: '📈', bg: 'var(--accent-glow)' },
          { label: 'Goals Achieved', value: `${completed} / ${goals.length}`, icon: '🏆', bg: 'var(--yellow-bg)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
            <div className="stat-info">
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ fontSize: 20 }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="tabs animate-fadeUp animate-delay-2" style={{ marginBottom: 20, maxWidth: 260 }}>
        <button className={`tab ${tab === 'active' ? 'active' : ''}`} onClick={() => setTab('active')}>Active ({goals.filter(g => !g.isCompleted).length})</button>
        <button className={`tab ${tab === 'completed' ? 'active' : ''}`} onClick={() => setTab('completed')}>Achieved ({completed})</button>
      </div>

      {loading ? (
        <div className="grid-2">{[1,2].map(i => <div key={i} className="goal-card" style={{ minHeight: 180 }} />)}</div>
      ) : filtered.length === 0 ? (
        <div className="card animate-fadeUp">
          <div className="empty-state">
            <div className="empty-icon">{tab === 'active' ? '🎯' : '🏆'}</div>
            <h3>{tab === 'active' ? 'No active goals' : 'No completed goals yet'}</h3>
            <p>{tab === 'active' ? 'Create your first savings goal to get started' : 'Keep saving — your completed goals will appear here!'}</p>
            {tab === 'active' && <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openAdd}>+ Create Goal</button>}
          </div>
        </div>
      ) : (
        <div className="grid-2 animate-fadeUp animate-delay-2">
          {filtered.map(goal => {
            const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
            const daysLeft = getDaysLeft(goal.deadline);
            return (
              <div key={goal._id} className={`goal-card ${goal.isCompleted ? 'completed' : ''}`}>
                <div className="goal-header">
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1 }}>
                    <div style={{ fontSize: 34, lineHeight: 1 }}>{goal.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div className="goal-title">{goal.title}</div>
                      <div className="goal-meta">{goal.category}</div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 7, flexWrap: 'wrap' }}>
                        <span className="badge" style={{ background: `${getPriorityColor(goal.priority)}20`, color: getPriorityColor(goal.priority), fontSize: 11 }}>
                          {goal.priority} priority
                        </span>
                        {daysLeft !== null && (
                          <span className={`badge ${daysLeft < 0 ? 'badge-red' : daysLeft < 30 ? 'badge-yellow' : 'badge-blue'}`} style={{ fontSize: 11 }}>
                            {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? 'Due today!' : `${daysLeft}d left`}
                          </span>
                        )}
                        {goal.isCompleted && <span className="badge badge-green" style={{ fontSize: 11 }}>✓ Achieved!</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <button className="btn btn-ghost btn-icon" style={{ fontSize: 14 }} onClick={() => openEdit(goal)}>✏️</button>
                    <button className="btn btn-ghost btn-icon" style={{ fontSize: 14 }} onClick={() => setDeleteTarget(goal._id)}>🗑️</button>
                  </div>
                </div>

                <div className="goal-amounts">
                  <span className="goal-current">{formatCurrency(goal.currentAmount, currency)}</span>
                  <span className="goal-target">of {formatCurrency(goal.targetAmount, currency)}</span>
                </div>
                <div className="progress-bar" style={{ height: 10 }}>
                  <div className="progress-fill" style={{ width: `${pct}%`, background: goal.isCompleted ? 'var(--green)' : (goal.color || 'var(--accent)') }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                  <span>{pct}% reached</span>
                  <span>{formatCurrency(Math.max(0, goal.targetAmount - goal.currentAmount), currency)} to go</span>
                </div>

                {goal.notes && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10, fontStyle: 'italic', lineHeight: 1.5 }}>{goal.notes}</p>}

                {!goal.isCompleted && (
                  <div className="goal-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => setShowContrib(goal._id)}>+ Add Funds</button>
                    {goal.contributions?.length > 0 && (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', alignSelf: 'center' }}>{goal.contributions.length} contribution{goal.contributions.length !== 1 ? 's' : ''}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editItem ? 'Edit Goal' : 'New Savings Goal'}</h2>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Goal Name</label>
                <input className="form-input" name="title" value={form.title} onChange={handleChange} placeholder="e.g. Dream Vacation" required autoFocus />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Target Amount ({currency})</label>
                  <input className="form-input" type="number" name="targetAmount" value={form.targetAmount} onChange={handleChange} placeholder="10000" min="1" step="0.01" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Already Saved</label>
                  <input className="form-input" type="number" name="currentAmount" value={form.currentAmount} onChange={handleChange} placeholder="0" min="0" step="0.01" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" name="category" value={form.category} onChange={handleChange}>
                    {SAVINGS_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-select" name="priority" value={form.priority} onChange={handleChange}>
                    <option value="low">🟢 Low</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="high">🔴 High</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Deadline (optional)</label>
                <input className="form-input" type="date" name="deadline" value={form.deadline} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Icon</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {SAVINGS_ICONS.map(ic => (
                    <button key={ic} type="button" onClick={() => setForm(f => ({ ...f, icon: ic }))}
                      style={{ width: 38, height: 38, borderRadius: 9, border: form.icon === ic ? '2px solid var(--accent)' : '2px solid var(--border)', background: form.icon === ic ? 'var(--accent-glow)' : 'var(--bg-elevated)', cursor: 'pointer', fontSize: 20, transition: 'all 0.15s' }}>
                      {ic}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Color</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {GOAL_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                      style={{ width: 30, height: 30, borderRadius: '50%', background: c, border: form.color === c ? '3px solid white' : '2px solid transparent', cursor: 'pointer', boxShadow: form.color === c ? `0 0 0 2px ${c}` : 'none', transition: 'all 0.15s' }} />
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Notes (optional)</label>
                <textarea className="form-textarea" name="notes" value={form.notes} onChange={handleChange} placeholder="Why is this goal important to you?" rows={2} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Saving…</> : (editItem ? '💾 Save Changes' : '🎯 Create Goal')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contribute Modal */}
      {showContrib && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowContrib(null)}>
          <div className="modal" style={{ maxWidth: 360 }}>
            <div className="modal-header">
              <h2 className="modal-title">Add Funds</h2>
              <button className="modal-close" onClick={() => setShowContrib(null)}>✕</button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
              Contributing to: <strong>{goals.find(g => g._id === showContrib)?.title}</strong>
            </p>
            <form onSubmit={handleContribute}>
              <div className="form-group">
                <label className="form-label">Amount ({currency})</label>
                <input className="form-input" type="number" value={contrib.amount} onChange={e => setContrib(c => ({ ...c, amount: e.target.value }))} placeholder="100" min="0.01" step="0.01" required autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Note (optional)</label>
                <input className="form-input" value={contrib.note} onChange={e => setContrib(c => ({ ...c, note: e.target.value }))} placeholder="e.g. Monthly deposit" />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowContrib(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Saving…</> : '💰 Add Funds'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Savings Goal"
        message="This goal and all its contribution history will be permanently deleted."
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
