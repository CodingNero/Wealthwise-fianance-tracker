import React, { useState, useEffect, useCallback } from 'react';
import { Bar, Line, Doughnut, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement,
  LineElement, Title, Tooltip, Legend, ArcElement, RadialLinearScale, Filler
} from 'chart.js';
import { getExpenseSummary, getExpenses } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, CATEGORY_COLORS, CATEGORY_ICONS, getCurrentMonthYear, getMonthLabel, MONTHS } from '../utils/helpers';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, RadialLinearScale, Filler);

const tooltipTheme = {
  backgroundColor: '#16161f',
  borderColor: 'rgba(255,255,255,0.06)',
  borderWidth: 1,
  titleColor: '#f0f0fa',
  bodyColor: '#8b8ba0',
};

export default function Analysis() {
  const { user } = useAuth();
  const [summaryData, setSummaryData] = useState([]);
  const [currentSummary, setCurrentSummary] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const { month, year } = getCurrentMonthYear();
  const currency = user?.currency || 'USD';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const promises = [];
      // Fetch last 6 months summary
      for (let i = 5; i >= 0; i--) {
        const d = new Date(year, month - 1 - i, 1);
        promises.push(getExpenseSummary({ month: d.getMonth() + 1, year: d.getFullYear() }));
      }
      const results = await Promise.all(promises);
      setSummaryData(results.map(r => r.data));
      setCurrentSummary(results[results.length - 1].data);

      const expRes = await getExpenses({ limit: 200, sort: '-date' });
      setExpenses(expRes.data.expenses);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [month, year]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
      <div className="spinner" style={{ width: 36, height: 36 }} />
    </div>
  );

  const months6 = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(year, month - 1 - i, 1);
    months6.push(d.toLocaleString('default', { month: 'short' }));
  }

  // Bar chart: income vs expenses
  const barData = {
    labels: months6,
    datasets: [
      {
        label: 'Income',
        data: summaryData.map(d => d?.totalIncome || 0),
        backgroundColor: 'rgba(52,211,153,0.7)',
        borderColor: '#34d399',
        borderWidth: 2,
        borderRadius: 6,
      },
      {
        label: 'Expenses',
        data: summaryData.map(d => d?.totalExpenses || 0),
        backgroundColor: 'rgba(248,113,113,0.7)',
        borderColor: '#f87171',
        borderWidth: 2,
        borderRadius: 6,
      },
    ],
  };

  // Line chart: savings trend
  const savingsData = summaryData.map(d => Math.max(0, (d?.totalIncome || 0) - (d?.totalExpenses || 0)));
  const lineData = {
    labels: months6,
    datasets: [{
      label: 'Net Savings',
      data: savingsData,
      borderColor: '#7c6af7',
      backgroundColor: 'rgba(124,106,247,0.1)',
      tension: 0.4,
      fill: true,
      pointBackgroundColor: '#7c6af7',
      pointRadius: 5,
      pointHoverRadius: 8,
    }],
  };

  // Category breakdown donut (this month)
  const catEntries = Object.entries(currentSummary?.byCategory || {}).sort((a, b) => b[1] - a[1]);
  const doughnutData = {
    labels: catEntries.map(([k]) => k),
    datasets: [{
      data: catEntries.map(([, v]) => v),
      backgroundColor: catEntries.map(([k]) => CATEGORY_COLORS[k] + 'bb'),
      borderColor: catEntries.map(([k]) => CATEGORY_COLORS[k]),
      borderWidth: 2,
      hoverOffset: 8,
    }],
  };

  // Radar: spending categories vs last month
  const allCats = Object.keys(CATEGORY_COLORS);
  const curMonthCats = currentSummary?.byCategory || {};
  const prevMonthCats = summaryData[summaryData.length - 2]?.byCategory || {};
  const maxVal = Math.max(...allCats.map(c => Math.max(curMonthCats[c] || 0, prevMonthCats[c] || 0)), 1);
  const radarData = {
    labels: allCats,
    datasets: [
      {
        label: 'This Month',
        data: allCats.map(c => curMonthCats[c] || 0),
        backgroundColor: 'rgba(124,106,247,0.2)',
        borderColor: '#7c6af7',
        pointBackgroundColor: '#7c6af7',
        borderWidth: 2,
      },
      {
        label: 'Last Month',
        data: allCats.map(c => prevMonthCats[c] || 0),
        backgroundColor: 'rgba(248,113,113,0.15)',
        borderColor: '#f87171',
        pointBackgroundColor: '#f87171',
        borderWidth: 2,
      },
    ],
  };

  const baseChartOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#8b8ba0', font: { family: 'DM Sans', size: 12 }, boxWidth: 10 } },
      tooltip: { ...tooltipTheme, callbacks: { label: (ctx) => ` ${formatCurrency(ctx.raw, currency)}` } }
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#55556a', font: { family: 'DM Sans' } } },
      y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#55556a', font: { family: 'DM Sans' }, callback: v => formatCurrency(v, currency) } }
    }
  };

  const radarOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#8b8ba0', font: { family: 'DM Sans', size: 12 }, boxWidth: 10 } },
      tooltip: { ...tooltipTheme, callbacks: { label: (ctx) => ` ${formatCurrency(ctx.raw, currency)}` } }
    },
    scales: {
      r: {
        grid: { color: 'rgba(255,255,255,0.06)' },
        ticks: { color: '#55556a', backdropColor: 'transparent', font: { family: 'DM Sans', size: 10 } },
        pointLabels: { color: '#8b8ba0', font: { family: 'DM Sans', size: 11 } },
        angleLines: { color: 'rgba(255,255,255,0.06)' },
      }
    }
  };

  // Daily spending (last 30 days)
  const last30 = expenses.filter(e => {
    const d = new Date(e.date);
    const diff = (new Date() - d) / (1000 * 60 * 60 * 24);
    return diff <= 30 && e.type === 'expense';
  });

  const dailyMap = {};
  last30.forEach(e => {
    const key = e.date.split('T')[0];
    dailyMap[key] = (dailyMap[key] || 0) + e.amount;
  });
  const dailyKeys = Object.keys(dailyMap).sort().slice(-14);
  const dailyData = {
    labels: dailyKeys.map(k => new Date(k).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [{
      label: 'Daily Spending',
      data: dailyKeys.map(k => dailyMap[k]),
      backgroundColor: 'rgba(124,106,247,0.6)',
      borderColor: '#7c6af7',
      borderWidth: 2,
      borderRadius: 4,
    }],
  };

  // Insights
  const totalSpent6Mo = summaryData.reduce((s, d) => s + (d?.totalExpenses || 0), 0);
  const avgMonthly = totalSpent6Mo / 6;
  const thisMonth = currentSummary?.totalExpenses || 0;
  const vsAvg = avgMonthly > 0 ? Math.round(((thisMonth - avgMonthly) / avgMonthly) * 100) : 0;
  const topCat = catEntries[0];
  const savingsRate = currentSummary?.totalIncome > 0 ? Math.round(((currentSummary.totalIncome - thisMonth) / currentSummary.totalIncome) * 100) : 0;

  return (
    <div>
      <div className="page-header animate-fadeUp">
        <div>
          <h1 className="page-title">Analysis</h1>
          <p className="page-subtitle">Insights into your spending patterns</p>
        </div>
      </div>

      {/* Insight cards */}
      <div className="stat-grid animate-fadeUp animate-delay-1">
        {[
          { label: 'Avg Monthly Spend', value: formatCurrency(avgMonthly, currency), icon: '📊', bg: 'var(--blue-bg)' },
          { label: 'vs Last 6mo Avg', value: `${vsAvg > 0 ? '+' : ''}${vsAvg}%`, icon: vsAvg > 10 ? '📈' : vsAvg < -10 ? '📉' : '➡️', bg: vsAvg > 0 ? 'var(--red-bg)' : 'var(--green-bg)', color: vsAvg > 0 ? 'var(--red)' : 'var(--green)' },
          { label: 'Top Category', value: topCat ? `${CATEGORY_ICONS[topCat[0]]} ${topCat[0]}` : 'N/A', icon: '🏆', bg: 'var(--yellow-bg)' },
          { label: 'Savings Rate', value: `${Math.max(0, savingsRate)}%`, icon: '💹', bg: savingsRate > 20 ? 'var(--green-bg)' : 'var(--red-bg)', color: savingsRate > 20 ? 'var(--green)' : 'var(--red)' },
        ].map((s, i) => (
          <div key={s.label} className={`stat-card animate-delay-${i + 1}`}>
            <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
            <div className="stat-info">
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ color: s.color || 'var(--text-primary)', fontSize: 20 }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main charts */}
      <div className="grid-2 animate-fadeUp animate-delay-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Income vs Expenses</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>6 months</span>
          </div>
          <div style={{ height: 240 }}>
            <Bar data={barData} options={{ ...baseChartOpts, plugins: { ...baseChartOpts.plugins } }} />
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Savings Trend</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>6 months</span>
          </div>
          <div style={{ height: 240 }}>
            <Line data={lineData} options={baseChartOpts} />
          </div>
        </div>
      </div>

      <div className="grid-2 animate-fadeUp animate-delay-3" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Category Breakdown</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>This month</span>
          </div>
          {catEntries.length > 0 ? (
            <>
              <div style={{ height: 220 }}>
                <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { ...tooltipTheme, callbacks: { label: (ctx) => ` ${formatCurrency(ctx.raw, currency)}` } } }, cutout: '65%' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 14 }}>
                {catEntries.slice(0, 5).map(([cat, amt]) => (
                  <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: CATEGORY_COLORS[cat], flexShrink: 0 }} />
                    <span style={{ fontSize: 13, flex: 1 }}>{CATEGORY_ICONS[cat]} {cat}</span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{formatCurrency(amt, currency)}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 36, textAlign: 'right' }}>
                      {currentSummary?.totalExpenses > 0 ? Math.round((amt / currentSummary.totalExpenses) * 100) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <div className="empty-icon">📊</div>
              <p>No expense data this month</p>
            </div>
          )}
        </div>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Category Comparison</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>This vs last month</span>
          </div>
          <div style={{ height: 300 }}>
            <Radar data={radarData} options={radarOpts} />
          </div>
        </div>
      </div>

      {/* Daily spending */}
      <div className="card animate-fadeUp animate-delay-4">
        <div className="card-header">
          <span className="card-title">Daily Spending</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Last 14 days</span>
        </div>
        {dailyKeys.length > 0 ? (
          <div style={{ height: 220 }}>
            <Bar data={dailyData} options={baseChartOpts} />
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '40px 0' }}>
            <div className="empty-icon">📅</div>
            <p>No spending data in the last 14 days</p>
          </div>
        )}
      </div>
    </div>
  );
}
