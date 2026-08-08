'use client';

import { useAuth } from '@/context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 8 }}>
          Welcome back, {user?.name?.split(' ')[0]}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Here&apos;s an overview of your projects and recent activity.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
        <StatCard title="Projects" value="—" subtitle="Create your first project" />
        <StatCard title="Reviews" value="—" subtitle="No reviews yet" />
        <StatCard title="AI Providers" value="—" subtitle="Configure a provider" />
      </div>

      <div className="card" style={{ padding: 40, textAlign: 'center' }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 16 }}>
          <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Get started</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20, maxWidth: 360, margin: '0 auto 20px' }}>
          Create a project, upload your source code as a ZIP file, and run AI-powered code reviews.
        </p>
        <a href="/projects" className="btn-primary" style={{ display: 'inline-flex' }}>
          Go to Projects
        </a>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle }: { title: string; value: string; subtitle: string }) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 500 }}>{title}</p>
      <p style={{ fontSize: 28, fontWeight: 700, marginBottom: 4, letterSpacing: '-1px' }}>{value}</p>
      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{subtitle}</p>
    </div>
  );
}
