'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { projectService } from '@/services/project.service';
import type { Project } from '@/types/project';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      const data = await projectService.getAll();
      setProjects(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">Manage your source code projects</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Project
        </button>
      </div>

      {isLoading ? (
        <div className="loading-state">
          {[1,2,3].map(i => <div key={i} className="skeleton-card" />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <h3>No projects yet</h3>
          <p>Create your first project to start uploading and reviewing code.</p>
          <button className="btn-primary" onClick={() => setShowCreate(true)}>Create Project</button>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(project => (
            <Link key={project.id} href={`/projects/${project.id}`} className="project-card card">
              <div className="project-card-header">
                <h3>{project.name}</h3>
                <button
                  className="delete-btn"
                  onClick={(e) => { e.preventDefault(); setDeleteTarget(project); }}
                  title="Delete project"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                </button>
              </div>
              {project.description && (
                <p className="project-desc">{project.description}</p>
              )}
              <div className="project-meta">
                <span>{project._count?.files || 0} files</span>
                <span>{project._count?.reviews || 0} reviews</span>
                <span>{new Date(project.createdAt).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateProjectDialog
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); fetchProjects(); }}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmDialog
          project={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => { setDeleteTarget(null); fetchProjects(); }}
        />
      )}

      <style jsx>{`
        .page-header {
          display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; gap: 16px; flex-wrap: wrap;
        }
        .page-title { font-size: 24px; font-weight: 700; letter-spacing: -0.5px; margin-bottom: 4px; }
        .page-subtitle { font-size: 14px; color: var(--text-secondary); }
        .loading-state { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
        .skeleton-card { height: 140px; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px solid var(--border-color); animation: pulse 1.5s ease-in-out infinite alternate; }
        @keyframes pulse { from { opacity: 0.6; } to { opacity: 1; } }
        .empty-state { text-align: center; padding: 60px 20px; }
        .empty-state h3 { font-size: 16px; font-weight: 600; margin: 16px 0 8px; }
        .empty-state p { color: var(--text-secondary); font-size: 14px; margin-bottom: 20px; max-width: 320px; margin-left: auto; margin-right: auto; }
        .projects-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
        .project-card { display: block; padding: 20px; text-decoration: none; color: inherit; cursor: pointer; }
        .project-card:hover { border-color: var(--accent-primary); box-shadow: 0 0 20px rgba(99, 102, 241, 0.08); }
        .project-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
        .project-card-header h3 { font-size: 16px; font-weight: 600; }
        .delete-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 4px; border-radius: 4px; transition: all 0.15s; }
        .delete-btn:hover { color: var(--danger); background: rgba(239, 68, 68, 0.1); }
        .project-desc { font-size: 13px; color: var(--text-secondary); margin-bottom: 12px; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .project-meta { display: flex; gap: 16px; font-size: 12px; color: var(--text-muted); }
      `}</style>
    </div>
  );
}

function CreateProjectDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await projectService.create({ name, description: description || undefined });
      toast.success('Project created!');
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content card animate-fade-in" onClick={e => e.stopPropagation()}>
        <h2>Create Project</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Project Name</label>
            <input className="input-field" value={name} onChange={e => setName(e.target.value)} placeholder="My Project" required minLength={1} maxLength={100} autoFocus />
          </div>
          <div className="form-group">
            <label>Description (optional)</label>
            <textarea className="input-field" value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description..." rows={3} maxLength={500} style={{ resize: 'vertical' }} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
        <style jsx>{`
          .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; backdrop-filter: blur(4px); }
          .modal-content { width: 100%; max-width: 440px; padding: 28px; }
          .modal-content h2 { font-size: 18px; font-weight: 700; margin-bottom: 20px; }
          .form-group { margin-bottom: 16px; display: flex; flex-direction: column; gap: 6px; }
          .form-group label { font-size: 13px; font-weight: 500; color: var(--text-secondary); }
          .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; }
        `}</style>
      </div>
    </div>
  );
}

function DeleteConfirmDialog({ project, onClose, onDeleted }: { project: Project; onClose: () => void; onDeleted: () => void }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await projectService.delete(project.id);
      toast.success('Project deleted');
      onDeleted();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content card animate-fade-in" onClick={e => e.stopPropagation()}>
        <h2>Delete Project</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
          Are you sure you want to delete <strong>&quot;{project.name}&quot;</strong>? This will permanently remove all files, reviews, and chat history.
        </p>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-danger" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete Project'}
          </button>
        </div>
        <style jsx>{`
          .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; backdrop-filter: blur(4px); }
          .modal-content { width: 100%; max-width: 400px; padding: 28px; }
          .modal-content h2 { font-size: 18px; font-weight: 700; margin-bottom: 12px; }
          .modal-actions { display: flex; justify-content: flex-end; gap: 10px; }
        `}</style>
      </div>
    </div>
  );
}
