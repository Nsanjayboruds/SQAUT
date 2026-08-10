'use client';

import { useAuth } from '@/context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.8px', marginBottom: 8, color: 'var(--text-primary)' }}>
          Welcome back, {user?.name?.split(' ')[0]}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
          Here's an overview of your projects and recent activity.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 40 }}>
        <StatCard title="Projects" value="—" subtitle="Create your first project" />
        <StatCard title="Reviews" value="—" subtitle="No reviews yet" />
        <StatCard title="AI Providers" value="—" subtitle="Configure a provider" />
      </div>

      <div className="card glass-panel" style={{ padding: 48, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ 
          width: 64, height: 64, borderRadius: 16, background: 'rgba(255,255,255,0.03)', 
          border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{color: 'var(--text-muted)'}}>
            <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        </div>
        <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Get started</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: 28, maxWidth: 360, margin: '0 auto 28px', lineHeight: 1.6 }}>
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
    <div className="card glass" style={{ padding: 24 }}>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</p>
      <p style={{ fontSize: 32, fontWeight: 800, marginBottom: 6, letterSpacing: '-1px', color: 'white' }}>{value}</p>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{subtitle}</p>
    </div>
  );
}
