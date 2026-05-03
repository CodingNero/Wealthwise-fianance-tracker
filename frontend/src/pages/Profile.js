import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../services/api';
import { getInitials } from '../utils/helpers';

const CURRENCIES = [
  { code: 'USD', label: 'US Dollar ($)' }, { code: 'EUR', label: 'Euro (€)' },
  { code: 'GBP', label: 'British Pound (£)' }, { code: 'INR', label: 'Indian Rupee (₹)' },
  { code: 'JPY', label: 'Japanese Yen (¥)' }, { code: 'CAD', label: 'Canadian Dollar (C$)' },
  { code: 'AUD', label: 'Australian Dollar (A$)' }, { code: 'SGD', label: 'Singapore Dollar (S$)' },
  { code: 'AED', label: 'UAE Dirham (د.إ)' },
];

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', monthlyIncome: user?.monthlyIncome || '', currency: user?.currency || 'USD' });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setSuccess(false); setError('');
    try {
      const res = await updateProfile({ ...form, monthlyIncome: parseFloat(form.monthlyIncome) || 0 });
      updateUser(res.data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally { setSaving(false); }
  };

  return (
    <div>
      <div className="page-header animate-fadeUp">
        <div>
          <h1 className="page-title">Profile & Settings</h1>
          <p className="page-subtitle">Manage your account preferences</p>
        </div>
      </div>

      <div style={{ maxWidth: 600 }}>
        {/* Avatar card */}
        <div className="card animate-fadeUp animate-delay-1" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 800, color: 'white', flexShrink: 0, boxShadow: '0 8px 24px var(--accent-glow)' }}>
            {getInitials(user?.name)}
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'Syne' }}>{user?.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{user?.email}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Edit form */}
        <div className="card animate-fadeUp animate-delay-2">
          <div className="card-header">
            <span className="card-title">Account Details</span>
          </div>

          {success && (
            <div style={{ background: 'var(--green-bg)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 8 }}>
              ✅ Profile updated successfully
            </div>
          )}
          {error && (
            <div style={{ background: 'var(--red-bg)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'var(--red)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" name="name" value={form.name} onChange={handleChange} placeholder="Your name" required />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" value={user?.email} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Email cannot be changed</p>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Monthly Income</label>
                <input className="form-input" type="number" name="monthlyIncome" value={form.monthlyIncome} onChange={handleChange} placeholder="5000" min="0" step="0.01" />
              </div>
              <div className="form-group">
                <label className="form-label">Currency</label>
                <select className="form-select" name="currency" value={form.currency} onChange={handleChange}>
                  {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Saving…</> : '💾 Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* App info */}
        <div className="card animate-fadeUp animate-delay-3" style={{ marginTop: 20 }}>
          <div className="card-header"><span className="card-title">About</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              ['App', 'Wealthwise Finance Tracker'],
              ['Version', '1.0.0'],
              ['Stack', 'MongoDB · Express · React · Node.js'],
              ['Charts', 'Chart.js + react-chartjs-2'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
                <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
