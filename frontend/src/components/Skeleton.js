import React from 'react';

export function SkeletonBox({ width = '100%', height = 20, radius = 8, style = {} }) {
  return (
    <div style={{
      width, height,
      borderRadius: radius,
      background: 'linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-card-hover) 50%, var(--bg-elevated) 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.4s infinite',
      flexShrink: 0,
      ...style
    }} />
  );
}

export function SkeletonStatCard() {
  return (
    <div className="stat-card" style={{ gap: 14 }}>
      <SkeletonBox width={44} height={44} radius={12} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <SkeletonBox width="60%" height={12} />
        <SkeletonBox width="80%" height={24} />
      </div>
    </div>
  );
}

export function SkeletonCard({ rows = 3 }) {
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <SkeletonBox width={120} height={16} />
        <SkeletonBox width={60} height={12} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <SkeletonBox width={36} height={36} radius={10} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <SkeletonBox width="55%" height={13} />
              <SkeletonBox width="35%" height={11} />
            </div>
            <SkeletonBox width={60} height={14} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonChartCard() {
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <SkeletonBox width={150} height={16} />
        <SkeletonBox width={80} height={12} />
      </div>
      <SkeletonBox width="100%" height={220} radius={10} />
    </div>
  );
}
