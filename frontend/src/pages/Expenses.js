import React, { useState, useEffect, useCallback } from 'react';
import { getExpenses, createExpense, updateExpense, deleteExpense } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate, CATEGORIES, CATEGORY_ICONS, getCategoryClass } from '../utils/helpers';
import ConfirmDialog from '../components/ConfirmDialog';
import { SkeletonCard } from '../components/Skeleton';

const EMPTY_FORM = { title: '', amount: '', category: 'Food', type: 'expense', date: new Date().toISOString().split('T')[0], notes: '' };

export default function Expenses() {
  const { user } = useAuth();
  const toast = useToast();
  const [expenses, setExpenses] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState({ category: '', type: '', page: 1 });
  const [pages, setPages] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const currency = user?.currency || 'USD';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 20, sort: '-date', page: filters.page };
      if (filters.category) params.category = filters.category;
      if (filters.type) params.type = filters.type;
      const res = await getExpenses(params);
      setExpenses(res.data.expenses);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch (e) { toast.error('Failed to load transactions'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditItem(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (exp) => {
    setEditItem(exp);
    setForm({ title: exp.title, amount: exp.amount, category: exp.category, type: exp.type, date: exp.date.split('T')[0], notes: exp.notes || '' });
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditItem(null); };
  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { ...form, amount: parseFloat(form.amount) };
      if (editItem) { await updateExpense(editItem._id, payload); toast.success('Transaction updated'); }
      else { await createExpense(payload); toast.success('Transaction added'); }
      closeModal(); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save transaction'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await deleteExpense(deleteTarget); setDeleteTarget(null); load(); toast.success('Transaction deleted'); }
    catch (e) { toast.error('Failed to delete'); }
  };

  const totalExpenses = expenses.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
  const totalIncome = expenses.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);

  return (
    <div>
      <div className="page-header animate-fadeUp">
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="page-subtitle">{total} total records</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Transaction</button>
      </div>

      {/* Summary pills */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }} className="animate-fadeUp animate-delay-1">
        <div style={{ background: 'var(--green-bg)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 12, padding: '10px 18px' }}>
          <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Income</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--green)', fontFamily: 'Syne', letterSpacing: '-0.02em' }}>{formatCurrency(totalIncome, currency)}</div>
        </div>
        <div style={{ background: 'var(--red-bg)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 12, padding: '10px 18px' }}>
          <div style={{ fontSize: 11, color: 'var(--red)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Expenses</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--red)', fontFamily: 'Syne', letterSpacing: '-0.02em' }}>{formatCurrency(totalExpenses, currency)}</div>
        </div>
        <div style={{ background: 'var(--blue-bg)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 12, padding: '10px 18px' }}>
          <div style={{ fontSize: 11, color: 'var(--blue)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Net</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: totalIncome - totalExpenses >= 0 ? 'var(--green)' : 'var(--red)', fontFamily: 'Syne', letterSpacing: '-0.02em' }}>{formatCurrency(totalIncome - totalExpenses, currency)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar animate-fadeUp animate-delay-1">
        <select className="form-select" value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value, page: 1 }))}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="form-select" value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value, page: 1 }))}>
          <option value="">All Types</option>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
        {(filters.category || filters.type) && (
          <button className="btn btn-secondary btn-sm" onClick={() => setFilters({ category: '', type: '', page: 1 })}>✕ Clear</button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <SkeletonCard rows={8} />
      ) : (
        <div className="card animate-fadeUp animate-delay-2">
          {expenses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🧾</div>
              <h3>No transactions found</h3>
              <p>Add your first transaction to get started</p>
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openAdd}>+ Add Transaction</button>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Transaction</th>
                    <th>Category</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th style={{ width: 80 }} />
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(exp => (
                    <tr key={exp._id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{exp.title}</div>
                        {exp.notes && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{exp.notes}</div>}
                      </td>
                      <td>
                        <span className={`badge ${getCategoryClass(exp.category)}`}>
                          {CATEGORY_ICONS[exp.category]} {exp.category}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{formatDate(exp.date)}</td>
                      <td><span className={`badge ${exp.type === 'income' ? 'badge-green' : 'badge-red'}`}>{exp.type}</span></td>
                      <td style={{ textAlign: 'right' }}>
                        <span className={exp.type === 'income' ? 'amount-positive' : 'amount-negative'}>
                          {exp.type === 'income' ? '+' : '−'}{formatCurrency(exp.amount, currency)}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                          <button className="btn btn-ghost btn-icon" onClick={() => openEdit(exp)} title="Edit">✏️</button>
                          <button className="btn btn-ghost btn-icon" onClick={() => setDeleteTarget(exp._id)} title="Delete">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 20 }}>
              <button className="btn btn-secondary btn-sm" disabled={filters.page === 1} onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}>‹</button>
              {Array.from({ length: Math.min(pages, 7) }, (_, i) => (
                <button key={i} className={`btn btn-sm ${filters.page === i + 1 ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilters(f => ({ ...f, page: i + 1 }))}>
                  {i + 1}
                </button>
              ))}
              <button className="btn btn-secondary btn-sm" disabled={filters.page === pages} onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}>›</button>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editItem ? 'Edit Transaction' : 'Add Transaction'}</h2>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input className="form-input" name="title" value={form.title} onChange={handleChange} placeholder="e.g. Grocery shopping" required autoFocus />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Amount ({currency})</label>
                  <input className="form-input" type="number" name="amount" value={form.amount} onChange={handleChange} placeholder="0.00" min="0.01" step="0.01" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-select" name="type" value={form.type} onChange={handleChange}>
                    <option value="expense">💸 Expense</option>
                    <option value="income">💰 Income</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" name="category" value={form.category} onChange={handleChange}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input className="form-input" type="date" name="date" value={form.date} onChange={handleChange} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Notes (optional)</label>
                <textarea className="form-textarea" name="notes" value={form.notes} onChange={handleChange} placeholder="Any additional notes…" rows={2} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Saving…</> : (editItem ? '💾 Save Changes' : '+ Add Transaction')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Transaction"
        message="This transaction will be permanently removed. This action cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
