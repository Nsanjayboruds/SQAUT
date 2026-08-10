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
          <p className="page-subtitle">Configure OpenAI-compatible providers for code reviews and chat</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Provider
        </button>
      </div>

      {isLoading ? (
        <div style={{ display: 'grid', gap: 16 }}>
          {[1,2].map(i => <div key={i} className="glass" style={{ height: 110, borderRadius: 16 }} />)}
        </div>
      ) : providers.length === 0 ? (
        <div className="empty-state glass">
          <div className="empty-icon-wrapper">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          </div>
          <h3 className="empty-title">No AI providers configured</h3>
          <p className="empty-desc">
            Connect an OpenAI-compatible provider (like LM Studio, Ollama, or OpenAI) to start running code reviews and chatting with your codebase.
          </p>
          <button className="btn-primary" onClick={() => setShowCreate(true)}>Add Provider</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {providers.map(provider => (
            <div key={provider.id} className="provider-card glass">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{provider.name}</h3>
                    <span className="badge badge-primary">{provider.type}</span>
                    {provider.hasApiKey && (
                      <span className="badge badge-success">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 4}}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                        Key set
                      </span>
                    )}
                  </div>
                  <div className="provider-meta">
                    <div className="meta-item">
                      <span className="meta-label">Model</span>
                      <span className="meta-value">{provider.modelName}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Endpoint</span>
                      <span className="meta-value" style={{ fontFamily: 'monospace', fontSize: 13 }}>{provider.baseUrl}</span>
                    </div>
                  </div>
                </div>
                <div className="provider-actions">
                  <button className="btn-secondary" onClick={() => handleTest(provider.id)} disabled={testingId === provider.id}>
                    {testingId === provider.id ? <div className="spinner" style={{width: 14, height: 14, borderWidth: 2}} /> : 'Test Connection'}
                  </button>
                  <button className="btn-danger" onClick={() => handleDelete(provider.id)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && <CreateProviderDialog onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); fetchProviders(); }} />}
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
      toast.success('Provider added successfully!');
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add provider');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div className="modal-content animate-fade-scale" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add AI Provider</h2>
          <button className="close-btn" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Provider Name</label>
            <input className="input-field" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. My Local Llama 3" required autoFocus />
          </div>
          
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>Provider Type</label>
              <div className="select-wrapper">
                <select className="input-field" value={form.type} onChange={e => handleTypeChange(e.target.value)}>
                  <option value="openai">OpenAI</option>
                  <option value="lmstudio">LM Studio</option>
                  <option value="ollama">Ollama</option>
                  <option value="custom">Custom</option>
                </select>
                <svg className="select-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Model Name</label>
              <input className="input-field" value={form.modelName} onChange={e => setForm(f => ({ ...f, modelName: e.target.value }))} placeholder="e.g. gpt-4o-mini" required />
            </div>
          </div>
          
          <div className="form-group">
            <label>Base URL</label>
            <input className="input-field" value={form.baseUrl} onChange={e => setForm(f => ({ ...f, baseUrl: e.target.value }))} placeholder="https://api.openai.com/v1" required />
          </div>
          
          <div className="form-group">
            <label>
              API Key 
              {(form.type === 'ollama' || form.type === 'lmstudio') && <span className="label-hint">(optional for local providers)</span>}
            </label>
            <input className="input-field" type="password" value={form.apiKey} onChange={e => setForm(f => ({ ...f, apiKey: e.target.value }))} placeholder="sk-..." />
            <p className="help-text">Keys are securely encrypted at rest using AES-256-GCM.</p>
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? <div className="spinner" style={{width: 16, height: 16, borderWidth: 2}} /> : 'Save Provider'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
