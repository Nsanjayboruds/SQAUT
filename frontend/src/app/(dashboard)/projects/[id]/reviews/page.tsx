'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { reviewService } from '@/services/review.service';
import { fileService } from '@/services/file.service';
import { aiProviderService } from '@/services/ai-provider.service';
import type { Review } from '@/services/review.service';
import type { FileInfo } from '@/types/file';
import type { AIProvider } from '@/services/ai-provider.service';

export default function ProjectReviewsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const [reviews, setReviews] = useState<Review[]>([]);
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [reviewsData, filesData, providersData] = await Promise.all([
        reviewService.getByProject(projectId),
        fileService.getFileTree(projectId),
        aiProviderService.getAll(),
      ]);
      setReviews(reviewsData);
      setFiles(filesData);
      setProviders(providersData);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="animate-fade-in">
      <Link href={`/projects/${projectId}`} style={{ color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
        Back to Project
      </Link>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 12 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.5px' }}>Code Reviews</h1>
        <button className="btn-primary" onClick={() => setShowCreate(true)} disabled={providers.length === 0}>
          {providers.length === 0 ? 'Add AI Provider First' : 'New Review'}
        </button>
      </div>

      {isLoading ? (
        <div className="spinner" style={{ width: 28, height: 28, margin: '40px auto' }} />
      ) : reviews.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No reviews yet</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>Run your first AI-powered code review.</p>
          {providers.length === 0 ? (
            <Link href="/settings/ai-providers" className="btn-primary" style={{ display: 'inline-flex' }}>Configure AI Provider</Link>
          ) : (
            <button className="btn-primary" onClick={() => setShowCreate(true)}>Start Review</button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {reviews.map(review => (
            <Link key={review.id} href={`/reviews/${review.id}`} className="card" style={{ padding: 16, textDecoration: 'none', color: 'inherit' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>
                    {review.template === 'SECURITY' ? '🔒 Security' : review.template === 'PERFORMANCE' ? '⚡ Performance' : '✨ Code Quality'}
                  </span>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, maxWidth: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{review.summary}</p>
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>{new Date(review.createdAt).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateReviewDialog
          projectId={projectId}
          files={files}
          providers={providers}
          onClose={() => setShowCreate(false)}
          onCreated={(review) => { setShowCreate(false); router.push(`/reviews/${review.id}`); }}
        />
      )}
    </div>
  );
}

function CreateReviewDialog({ projectId, files, providers, onClose, onCreated }: {
  projectId: string; files: FileInfo[]; providers: AIProvider[];
  onClose: () => void; onCreated: (review: Review) => void;
}) {
  const [template, setTemplate] = useState('CODE_QUALITY');
  const [scope, setScope] = useState('PROJECT');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [providerId, setProviderId] = useState(providers[0]?.id || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (scope !== 'PROJECT' && selectedFiles.length === 0) {
      toast.error('Select at least one file');
      return;
    }
    setIsSubmitting(true);
    try {
      const review = await reviewService.create({
        projectId, template, scope,
        fileIds: scope !== 'PROJECT' ? selectedFiles : undefined,
        providerId,
      });
      toast.success('Review completed!');
      onCreated(review);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Review failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content card animate-fade-in" onClick={e => e.stopPropagation()}>
        <h2>Run Code Review</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Review Template</label>
            <select className="input-field" value={template} onChange={e => setTemplate(e.target.value)}>
              <option value="CODE_QUALITY">✨ Code Quality</option>
              <option value="SECURITY">🔒 Security</option>
              <option value="PERFORMANCE">⚡ Performance</option>
            </select>
          </div>
          <div className="form-group">
            <label>Scope</label>
            <select className="input-field" value={scope} onChange={e => setScope(e.target.value)}>
              <option value="PROJECT">Entire Project</option>
              <option value="FILE">Single File</option>
              <option value="MULTI_FILE">Multiple Files</option>
            </select>
          </div>
          {scope !== 'PROJECT' && (
            <div className="form-group">
              <label>Select Files</label>
              <div style={{ maxHeight: 200, overflow: 'auto', border: '1px solid var(--border-color)', borderRadius: 8, padding: 8 }}>
                {files.map(f => (
                  <label key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)' }}>
                    <input
                      type={scope === 'FILE' ? 'radio' : 'checkbox'}
                      name="file"
                      checked={selectedFiles.includes(f.id)}
                      onChange={e => {
                        if (scope === 'FILE') setSelectedFiles([f.id]);
                        else setSelectedFiles(prev => e.target.checked ? [...prev, f.id] : prev.filter(id => id !== f.id));
                      }}
                    />
                    {f.path}
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="form-group">
            <label>AI Provider</label>
            <select className="input-field" value={providerId} onChange={e => setProviderId(e.target.value)}>
              {providers.map(p => <option key={p.id} value={p.id}>{p.name} ({p.modelName})</option>)}
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? <><div className="spinner" /> Reviewing...</> : 'Run Review'}
            </button>
          </div>
        </form>
        <style jsx>{`
          .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; backdrop-filter: blur(4px); }
          .modal-content { width: 100%; max-width: 500px; padding: 28px; max-height: 90vh; overflow-y: auto; }
          .modal-content h2 { font-size: 18px; font-weight: 700; margin-bottom: 20px; }
          .form-group { margin-bottom: 16px; display: flex; flex-direction: column; gap: 6px; }
          .form-group label { font-size: 13px; font-weight: 500; color: var(--text-secondary); }
          select.input-field { appearance: none; cursor: pointer; }
          .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; }
        `}</style>
      </div>
    </div>
  );
}
