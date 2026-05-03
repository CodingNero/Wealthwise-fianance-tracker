import React, { useState, useEffect, useCallback } from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, Filler } from 'chart.js';
import { getExpenseSummary, getExpenses, getSavingsGoals } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatShortDate, CATEGORY_COLORS, CATEGORY_ICONS, getCategoryClass, getCurrentMonthYear, getMonthLabel } from '../utils/helpers';
import { SkeletonStatCard, SkeletonChartCard, SkeletonCard } from '../components/Skeleton';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, Filler);

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const { month, year } = getCurrentMonthYear();
  const currency = user?.currency || 'USD';

  const load = useCallback(async () => {
    try {
      const [sumRes, expRes, goalRes] = await Promise.all([
        getExpenseSummary({ month, year }),
        getExpenses({ limit: 6, sort: '-date', type: 'expense' }),
        getSavingsGoals(),
      ]);
      setSummary(sumRes.data);
      setRecentExpenses(expRes.data.expenses);
      setGoals(goalRes.data.slice(0, 3));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [month, year]);

  useEffect(() => { load(); }, [load]);

  const income = summary?.totalIncome || 0;
  const expenses = summary?.totalExpenses || 0;
  const net = income - expenses;
  const savingsRate = income > 0 ? Math.round((net / income) * 100) : 0;

  const tooltipStyle = {
    backgroundColor: '#16161f', borderColor: 'rgba(255,255,255,0.06)', borderWidth: 1,
    titleColor: '#f0f0fa', bodyColor: '#8b8ba0',
    callbacks: { label: ctx => ` ${formatCurrency(ctx.raw, currency)}` }
  };
  const scaleStyle = {
    x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#94a3b8', font: { family: 'Poppins', size: 13 } } },
    y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#94a3b8', font: { family: 'Poppins', size: 13 }, callback: v => formatCurrency(v, currency) } }
  };

  const lineData = {
    labels: summary?.trendData?.map(d => d.month) || [],
    datasets: [
      { label: 'Income', data: summary?.trendData?.map(d => d.income) || [], borderColor: '#34d399', backgroundColor: 'rgba(52,211,153,0.07)', tension: 0.4, fill: true, pointBackgroundColor: '#34d399', pointRadius: 4, pointHoverRadius: 7 },
      { label: 'Expenses', data: summary?.trendData?.map(d => d.expenses) || [], borderColor: '#f87171', backgroundColor: 'rgba(248,113,113,0.07)', tension: 0.4, fill: true, pointBackgroundColor: '#f87171', pointRadius: 4, pointHoverRadius: 7 },
    ],
  };
  const lineOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#cbd5e1', font: { family: 'Poppins', size: 14, weight: 500 }, boxWidth: 10 } }, tooltip: tooltipStyle }, scales: scaleStyle };

  const catEntries = Object.entries(summary?.byCategory || {}).sort((a, b) => b[1] - a[1]);
  const doughnutData = {
    labels: catEntries.map(([k]) => k),
    datasets: [{ data: catEntries.map(([, v]) => v), backgroundColor: catEntries.map(([k]) => CATEGORY_COLORS[k] + '99'), borderColor: catEntries.map(([k]) => CATEGORY_COLORS[k]), borderWidth: 2, hoverOffset: 8 }],
  };
  const doughnutOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#cbd5e1', font: { family: 'Poppins', size: 14, weight: 500 }, boxWidth: 10, padding: 14 } }, tooltip: tooltipStyle }, cutout: '72%' };

  if (loading) return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ height: 32, width: 280, background: 'var(--bg-elevated)', borderRadius: 8, marginBottom: 8, animation: 'shimmer 1.4s infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-card-hover) 50%, var(--bg-elevated) 75%)' }} />
        <div style={{ height: 16, width: 160, background: 'var(--bg-elevated)', borderRadius: 6, animation: 'shimmer 1.4s infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-card-hover) 50%, var(--bg-elevated) 75%)' }} />
      </div>
      <div className="stat-grid" style={{ marginBottom: 24 }}>{[1,2,3,4].map(i => <SkeletonStatCard key={i} />)}</div>
      <div className="grid-2" style={{ marginBottom: 20 }}><SkeletonChartCard /><SkeletonChartCard /></div>
      <div className="grid-2"><SkeletonCard rows={5} /><SkeletonCard rows={3} /></div>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="page-header animate-fadeUp">
        <div>
          <h1 className="page-title">Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">{getMonthLabel(month, year)} overview</p>
        </div>
        <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-secondary)', textAlign: 'right' }}>
          <div>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
        </div>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        {[
          { label: 'Monthly Income', value: formatCurrency(income, currency), icon: '💰', bg: 'var(--green-bg)', color: null },
          { label: 'Total Expenses', value: formatCurrency(expenses, currency), icon: '💸', bg: 'var(--red-bg)', color: null },
          { label: 'Net Savings', value: formatCurrency(net, currency), icon: net >= 0 ? '🏦' : '📉', bg: net >= 0 ? 'var(--blue-bg)' : 'var(--red-bg)', color: net >= 0 ? 'var(--green)' : 'var(--red)' },
          { label: 'Savings Rate', value: `${Math.max(0, savingsRate)}%`, icon: '📈', bg: 'var(--accent-glow)', color: savingsRate >= 20 ? 'var(--green)' : savingsRate < 0 ? 'var(--red)' : null },
        ].map((s, i) => (
          <div key={s.label} className={`stat-card animate-fadeUp animate-delay-${i + 1}`}>
            <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
            <div className="stat-info">
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ color: s.color || 'var(--text-primary)' }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid-2 animate-fadeUp animate-delay-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Income vs Expenses</span>
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>Last 6 months</span>
          </div>
          <div style={{ height: 220 }}><Line data={lineData} options={lineOpts} /></div>
        </div>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Spending Breakdown</span>
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>This month</span>
          </div>
          {catEntries.length > 0 ? (
            <div style={{ height: 220 }}><Doughnut data={doughnutData} options={doughnutOpts} /></div>
          ) : (
            <div className="empty-state" style={{ padding: '50px 0' }}>
              <div className="empty-icon">📊</div><p>No expenses recorded yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid-2 animate-fadeUp animate-delay-3">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Transactions</span>
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>Latest 6</span>
          </div>
          {recentExpenses.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px 0' }}>
              <div className="empty-icon">🧾</div><p>No transactions yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {recentExpenses.map((exp, i) => (
                <div key={exp._id} className="tx-row" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: i < recentExpenses.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div className={`badge ${getCategoryClass(exp.category)}`} style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0, padding: 0 }}>
                    {CATEGORY_ICONS[exp.category]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{exp.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{exp.category} · {formatShortDate(exp.date)}</div>
                  </div>
                  <div className="amount-negative" style={{ fontSize: 14, flexShrink: 0 }}>−{formatCurrency(exp.amount, currency)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Savings Goals</span>
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>Top 3</span>
          </div>
          {goals.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px 0' }}>
              <div className="empty-icon">🎯</div><p>No savings goals yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {goals.map(goal => {
                const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
                return (
                  <div key={goal._id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 20 }}>{goal.icon}</span>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{goal.title}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: goal.isCompleted ? 'var(--green)' : 'var(--text-secondary)' }}>{pct}%</span>
                    </div>
                    <div className="progress-bar" style={{ height: 6 }}>
                      <div className="progress-fill" style={{ width: `${pct}%`, background: goal.isCompleted ? 'var(--green)' : (goal.color || 'var(--accent)') }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 12, color: 'var(--text-muted)' }}>
                      <span>{formatCurrency(goal.currentAmount, currency)}</span>
                      <span>{formatCurrency(goal.targetAmount, currency)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
