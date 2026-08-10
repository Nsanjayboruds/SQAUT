'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { aiProviderService } from '@/services/ai-provider.service';
import type { AIProvider, CreateProviderInput } from '@/services/ai-provider.service';

const PROVIDER_PRESETS: Record<string, { baseUrl: string; modelName: string }> = {
  openai: { baseUrl: 'https://api.openai.com/v1', modelName: 'gpt-4o-mini' },
  lmstudio: { baseUrl: 'http://localhost:1234/v1', modelName: 'default' },
  ollama: { baseUrl: 'http://localhost:11434/v1', modelName: 'llama3.1' },
  custom: { baseUrl: '', modelName: '' },
};

export default function AIProvidersPage() {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);

  const fetchProviders = useCallback(async () => {
    try {
      const data = await aiProviderService.getAll();
      setProviders(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load providers');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchProviders(); }, [fetchProviders]);

  const handleTest = async (id: string) => {
    setTestingId(id);
    try {
      await aiProviderService.testConnection(id);
      toast.success('Connection successful!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setTestingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this AI provider?')) return;
    try {
      await aiProviderService.delete(id);
      toast.success('Provider deleted');
      fetchProviders();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">AI Providers</h1>
          <p className="page-subtitle">Configure AI providers for code reviews and chat</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Provider
        </button>
      </div>

      {isLoading ? (
        <div style={{ display: 'grid', gap: 12 }}>
          {[1,2].map(i => <div key={i} style={{ height: 100, background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border-color)' }} />)}
        </div>
      ) : providers.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.2"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: '16px 0 8px' }}>No AI providers configured</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20, maxWidth: 340, margin: '0 auto 20px' }}>
            Add an OpenAI-compatible provider to start running code reviews and chatting with AI.
          </p>
          <button className="btn-primary" onClick={() => setShowCreate(true)}>Add Provider</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {providers.map(provider => (
            <div key={provider.id} className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600 }}>{provider.name}</h3>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {provider.type}
                    </span>
                    {provider.hasApiKey && (
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'rgba(34,197,94,0.1)', color: 'var(--success)' }}>
                        🔑 Key set
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 20, fontSize: 13, color: 'var(--text-muted)' }}>
                    <span>Model: <strong style={{ color: 'var(--text-secondary)' }}>{provider.modelName}</strong></span>
                    <span>URL: <strong style={{ color: 'var(--text-secondary)' }}>{provider.baseUrl}</strong></span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-secondary" style={{ padding: '6px 14px', fontSize: 13 }} onClick={() => handleTest(provider.id)} disabled={testingId === provider.id}>
                    {testingId === provider.id ? 'Testing...' : 'Test'}
                  </button>
                  <button className="btn-danger" style={{ padding: '6px 14px', fontSize: 13 }} onClick={() => handleDelete(provider.id)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && <CreateProviderDialog onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); fetchProviders(); }} />}

      <style jsx>{`
        .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; gap: 16px; flex-wrap: wrap; }
        .page-title { font-size: 24px; font-weight: 700; letter-spacing: -0.5px; margin-bottom: 4px; }
        .page-subtitle { font-size: 14px; color: var(--text-secondary); }
      `}</style>
    </div>
  );
}

function CreateProviderDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState<CreateProviderInput>({
    name: '', type: 'openai', baseUrl: 'https://api.openai.com/v1', apiKey: '', modelName: 'gpt-4o-mini',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTypeChange = (type: string) => {
    const preset = PROVIDER_PRESETS[type];
    setForm(f => ({ ...f, type, baseUrl: preset.baseUrl, modelName: preset.modelName }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await aiProviderService.create({ ...form, apiKey: form.apiKey || undefined });
      toast.success('Provider added!');
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add provider');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content card animate-fade-in" onClick={e => e.stopPropagation()}>
        <h2>Add AI Provider</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Provider Name</label>
            <input className="input-field" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="My OpenAI" required />
          </div>
          <div className="form-group">
            <label>Type</label>
            <select className="input-field" value={form.type} onChange={e => handleTypeChange(e.target.value)}>
              <option value="openai">OpenAI</option>
              <option value="lmstudio">LM Studio</option>
              <option value="ollama">Ollama</option>
              <option value="custom">Custom (OpenAI-compatible)</option>
            </select>
          </div>
          <div className="form-group">
            <label>Base URL</label>
            <input className="input-field" value={form.baseUrl} onChange={e => setForm(f => ({ ...f, baseUrl: e.target.value }))} placeholder="https://api.openai.com/v1" required />
          </div>
          <div className="form-group">
            <label>API Key {form.type === 'ollama' || form.type === 'lmstudio' ? '(optional for local)' : ''}</label>
            <input className="input-field" type="password" value={form.apiKey} onChange={e => setForm(f => ({ ...f, apiKey: e.target.value }))} placeholder="sk-..." />
          </div>
          <div className="form-group">
            <label>Model Name</label>
            <input className="input-field" value={form.modelName} onChange={e => setForm(f => ({ ...f, modelName: e.target.value }))} placeholder="gpt-4o-mini" required />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Adding...' : 'Add Provider'}</button>
          </div>
        </form>
        <style jsx>{`
          .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; backdrop-filter: blur(4px); }
          .modal-content { width: 100%; max-width: 480px; padding: 28px; }
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
