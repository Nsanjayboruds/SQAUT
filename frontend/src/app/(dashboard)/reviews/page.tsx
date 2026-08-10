'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { reviewService } from '@/services/review.service';
import type { Review } from '@/services/review.service';

const severityColors: Record<string, string> = {
  CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#f59e0b', LOW: '#22c55e',
};
const templateLabels: Record<string, string> = {
  SECURITY: '🔒 Security', PERFORMANCE: '⚡ Performance', CODE_QUALITY: '✨ Code Quality',
};

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchReviews = useCallback(async () => {
    try {
      const data = await reviewService.getAll({
        template: filter || undefined,
        search: search || undefined,
      });
      setReviews(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load reviews');
    } finally {
      setIsLoading(false);
    }
  }, [filter, search]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 4 }}>Reviews</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Browse your AI-powered code review history</p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          className="input-field"
          style={{ maxWidth: 280 }}
          placeholder="Search reviews..."
          value={search}
          onChange={e => { setSearch(e.target.value); setIsLoading(true); }}
        />
        <select className="input-field" style={{ maxWidth: 180, appearance: 'none', cursor: 'pointer' }} value={filter} onChange={e => { setFilter(e.target.value); setIsLoading(true); }}>
          <option value="">All Templates</option>
          <option value="SECURITY">Security</option>
          <option value="PERFORMANCE">Performance</option>
          <option value="CODE_QUALITY">Code Quality</option>
        </select>
      </div>

      {isLoading ? (
        <div style={{ display: 'grid', gap: 12 }}>
          {[1,2,3].map(i => <div key={i} style={{ height: 80, background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border-color)', animation: 'pulse 1.5s ease-in-out infinite alternate' }} />)}
        </div>
      ) : reviews.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No reviews yet</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Go to a project and run a code review to see results here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {reviews.map(review => (
            <Link key={review.id} href={`/reviews/${review.id}`} className="card" style={{ padding: 16, textDecoration: 'none', color: 'inherit', display: 'block' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{templateLabels[review.template] || review.template}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>•</span>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{review.project?.name}</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{review.summary}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  {review.result?.issues?.length > 0 && (
                    <div style={{ display: 'flex', gap: 4 }}>
                      {Object.entries(
                        review.result.issues.reduce((acc: Record<string, number>, issue) => {
                          acc[issue.severity] = (acc[issue.severity] || 0) + 1;
                          return acc;
                        }, {}),
                      ).map(([severity, count]) => (
                        <span key={severity} style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: `${severityColors[severity]}15`, color: severityColors[severity], fontWeight: 600 }}>
                          {count} {severity.toLowerCase()}
                        </span>
                      ))}
                    </div>
                  )}
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
