'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { projectService } from '@/services/project.service';
import type { Project } from '@/types/project';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProject = useCallback(async () => {
    try {
      const data = await projectService.getById(projectId);
      setProject(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load project');
      router.push('/projects');
    } finally {
      setIsLoading(false);
    }
  }, [projectId, router]);

  useEffect(() => { fetchProject(); }, [fetchProject]);

  if (isLoading) {
    return (
      <div className="animate-fade-in">
        <div style={{ height: 28, width: 200, background: 'var(--bg-card)', borderRadius: 8, marginBottom: 20 }} />
        <div style={{ height: 16, width: 300, background: 'var(--bg-card)', borderRadius: 6, marginBottom: 32 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {[1,2,3,4].map(i => <div key={i} style={{ height: 100, background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border-color)' }} />)}
        </div>
      </div>
    );
  }

  if (!project) return null;

  const navItems = [
    { href: `/projects/${project.id}/files`, label: 'Files', desc: 'Browse & upload code', icon: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6', count: project._count?.files },
    { href: `/projects/${project.id}/reviews`, label: 'Reviews', desc: 'AI-powered code reviews', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', count: project._count?.reviews },
    { href: `/projects/${project.id}/chat`, label: 'AI Chat', desc: 'Ask questions about your code', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', count: project._count?.chatSessions },
    { href: `/projects/${project.id}/docs`, label: 'Documentation', desc: 'Generate project docs', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { href: `/projects/${project.id}/architecture`, label: 'Architecture', desc: 'Analyze project architecture', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  ];

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 8 }}>
        <Link href="/projects" style={{ color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          Projects
        </Link>
      </div>

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 6 }}>{project.name}</h1>
        {project.description && <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{project.description}</p>}
        <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 6 }}>
          Created {new Date(project.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
        {navItems.map(item => (
          <Link key={item.href} href={item.href} className="card" style={{ padding: 20, textDecoration: 'none', color: 'inherit', display: 'block' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={item.icon} />
              </svg>
              <span style={{ fontWeight: 600, fontSize: 15 }}>{item.label}</span>
              {item.count !== undefined && (
                <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: 10 }}>
                  {item.count}
                </span>
              )}
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
