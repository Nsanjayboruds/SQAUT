'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { reviewService } from '@/services/review.service';
import type { Review } from '@/services/review.service';

const severityColors: Record<string, string> = {
  CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#f59e0b', LOW: '#22c55e',
};
const severityOrder = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

export default function ReviewDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [review, setReview] = useState<Review | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    reviewService.getById(id)
      .then(setReview)
      .catch(err => toast.error(err instanceof Error ? err.message : 'Failed to load review'))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" style={{ width: 28, height: 28 }} /></div>;
  if (!review) return null;

  const renderIcon = () => {
    switch (review.template) {
      case 'SECURITY': return '🔒';
      case 'PERFORMANCE': return '⚡';
      case 'CODE_QUALITY': return '✨';
      case 'ARCHITECTURE': return '🏗️';
      case 'DOCUMENTATION': return '📚';
      default: return '📄';
    }
  };

  const renderHeader = () => (
    <div style={{ marginBottom: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 6 }}>
        {renderIcon()} {review.template.replace('_', ' ')} Review
      </h1>
      <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text-muted)' }}>
        <span>Project: <strong style={{ color: 'var(--text-secondary)' }}>{review.project?.name}</strong></span>
        <span>{new Date(review.createdAt).toLocaleString()}</span>
      </div>
    </div>
  );

  const renderStandardReview = () => {
    const issues = review.result?.issues || [];
    const recs = review.result?.recommendations || [];
    const sortedIssues = [...issues].sort((a, b) => severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity));

    return (
      <>
        <div className="card glass-panel" style={{ padding: 20, marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>Summary</h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{review.result?.summary || review.summary}</p>
        </div>

        {sortedIssues.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Issues ({issues.length})</h2>
            <div style={{ display: 'grid', gap: 10 }}>
              {sortedIssues.map((issue, i) => (
                <div key={i} className="card glass" style={{ padding: 16, borderLeft: `3px solid ${severityColors[issue.severity]}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: `${severityColors[issue.severity]}15`, color: severityColors[issue.severity], fontWeight: 600, textTransform: 'uppercase' }}>
                      {issue.severity}
                    </span>
                    <h3 style={{ fontSize: 14, fontWeight: 600 }}>{issue.title}</h3>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 8 }}>{issue.description}</p>
                  {issue.file && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>📄 {issue.file}</p>}
                  {issue.recommendation && (
                    <div style={{ marginTop: 8, padding: 10, background: 'var(--bg-tertiary)', borderRadius: 8, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      <strong style={{ color: 'var(--accent-primary)', fontSize: 12 }}>💡 Recommendation:</strong> {issue.recommendation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {recs.length > 0 && (
          <div className="card glass" style={{ padding: 20 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>General Recommendations</h2>
            <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 8 }}>
              {recs.map((rec, i) => (
                <li key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--accent-primary)', flexShrink: 0 }}>→</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </>
    );
  };

  const renderArchitecture = () => {
    const arch = review.result || {};
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="card glass-panel" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>Architecture Summary</h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{review.summary}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {['frontend', 'backend', 'database', 'authentication', 'dataFlow'].map((key) => arch[key] ? (
            <div key={key} className="card glass" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, textTransform: 'capitalize', color: 'var(--accent-primary)' }}>
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{arch[key]}</p>
            </div>
          ) : null)}
        </div>

        {(arch.strengths?.length > 0 || arch.risks?.length > 0 || arch.recommendations?.length > 0) && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginTop: 10 }}>
            {arch.strengths?.length > 0 && (
              <div className="card glass" style={{ padding: 20, borderTop: '3px solid var(--success)' }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Strengths</h3>
                <ul style={{ paddingLeft: 20, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {arch.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}
            {arch.risks?.length > 0 && (
              <div className="card glass" style={{ padding: 20, borderTop: '3px solid var(--danger)' }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Risks & Issues</h3>
                <ul style={{ paddingLeft: 20, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {arch.risks.map((s: string, i: number) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}
            {arch.recommendations?.length > 0 && (
              <div className="card glass" style={{ padding: 20, borderTop: '3px solid var(--accent-primary)' }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Recommendations</h3>
                <ul style={{ paddingLeft: 20, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {arch.recommendations.map((s: string, i: number) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderDocumentation = () => {
    const doc = review.result?.markdown || 'No documentation generated.';
    return (
      <div className="card glass-panel" style={{ padding: 32 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20, color: 'var(--accent-primary)' }}>Generated README.md</h2>
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          padding: 24,
          borderRadius: 8,
          fontSize: 14,
          fontFamily: 'monospace',
          whiteSpace: 'pre-wrap',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-color)',
          maxHeight: '600px',
          overflowY: 'auto',
          lineHeight: 1.6
        }}>
          {doc}
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in">
      <Link href={`/projects/${review.projectId}/reviews`} style={{ color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
        Back to Code Reviews
      </Link>

      {renderHeader()}

      {review.template === 'ARCHITECTURE' ? renderArchitecture()
        : review.template === 'DOCUMENTATION' ? renderDocumentation()
        : renderStandardReview()}
    </div>
  );
}
