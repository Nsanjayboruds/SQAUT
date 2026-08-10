'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { chatService } from '@/services/chat.service';
import { aiProviderService } from '@/services/ai-provider.service';
import type { ChatSession, ChatMessage } from '@/services/chat.service';
import type { AIProvider } from '@/services/ai-provider.service';

export default function ChatPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [providerId, setProviderId] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    try {
      const [sessionsData, providersData] = await Promise.all([
        chatService.getSessions(projectId),
        aiProviderService.getAll(),
      ]);
      setSessions(sessionsData);
      setProviders(providersData);
      if (providersData.length > 0) setProviderId(providersData[0].id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const loadMessages = useCallback(async (sessionId: string) => {
    setActiveSession(sessionId);
    try {
      const msgs = await chatService.getMessages(sessionId);
      setMessages(msgs);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load messages');
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleNewSession = async () => {
    try {
      const session = await chatService.createSession(projectId);
      setSessions(prev => [session, ...prev]);
      setActiveSession(session.id);
      setMessages([]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create session');
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeSession || !providerId) return;

    const userMsg = input.trim();
    setInput('');
    setIsSending(true);

    // Optimistic update
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`, sessionId: activeSession,
      role: 'user', content: userMsg, createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const response = await chatService.sendMessage(activeSession, userMsg, providerId);
      // Replace temp and add assistant response
      setMessages(prev => [
        ...prev.filter(m => m.id !== tempUserMsg.id),
        { ...tempUserMsg, id: `user-${Date.now()}` },
        response,
      ]);
      // Update session title in sidebar
      setSessions(prev => prev.map(s =>
        s.id === activeSession ? { ...s, title: userMsg.substring(0, 60), updatedAt: new Date().toISOString() } : s,
      ));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send message');
      setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id));
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" style={{ width: 28, height: 28 }} /></div>;

  if (providers.length === 0) {
    return (
      <div className="animate-fade-in" style={{ textAlign: 'center', padding: 60 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>AI Provider Required</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>Configure an AI provider to start chatting about your code.</p>
        <Link href="/settings/ai-providers" className="btn-primary" style={{ display: 'inline-flex' }}>Add Provider</Link>
      </div>
    );
  }

  return (
    <div className="chat-layout animate-fade-in">
      <div className="chat-sidebar card">
        <div style={{ padding: 12, borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href={`/projects/${projectId}`} style={{ color: 'var(--text-muted)', fontSize: 12, textDecoration: 'none' }}>← Project</Link>
          <button onClick={handleNewSession} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: 18, padding: 4 }}>+</button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
          {sessions.map(s => (
            <button
              key={s.id}
              onClick={() => loadMessages(s.id)}
              style={{
                display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px',
                background: s.id === activeSession ? 'var(--bg-tertiary)' : 'none',
                border: 'none', borderRadius: 6, color: s.id === activeSession ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: 13, cursor: 'pointer', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}
            >
              {s.title}
            </button>
          ))}
        </div>
        <div style={{ padding: 10, borderTop: '1px solid var(--border-color)' }}>
          <select className="input-field" style={{ fontSize: 12, padding: '6px 8px' }} value={providerId} onChange={e => setProviderId(e.target.value)}>
            {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      <div className="chat-main">
        {!activeSession ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600 }}>AI Code Assistant</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, textAlign: 'center', maxWidth: 320 }}>
              Ask questions about your code. The AI has context of your uploaded project files.
            </p>
            <button className="btn-primary" onClick={handleNewSession}>Start New Chat</button>
          </div>
        ) : (
          <>
            <div className="messages-area">
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 14 }}>
                  Ask anything about your code...
                </div>
              )}
              {messages.map(msg => (
                <div key={msg.id} className={`message ${msg.role}`}>
                  <div className="message-avatar">
                    {msg.role === 'user' ? '👤' : '🤖'}
                  </div>
                  <div className="message-content">
                    <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'inherit', margin: 0, fontSize: 14, lineHeight: 1.6 }}>
                      {msg.content}
                    </pre>
                  </div>
                </div>
              ))}
              {isSending && (
                <div className="message assistant">
                  <div className="message-avatar">🤖</div>
                  <div className="message-content"><div className="spinner" /></div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="chat-input-area">
              <input
                className="input-field"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask about your code..."
                disabled={isSending}
                autoFocus
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn-primary" disabled={isSending || !input.trim()} style={{ padding: '10px 16px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </form>
          </>
        )}
      </div>

      <style jsx>{`
        .chat-layout { display: grid; grid-template-columns: 220px 1fr; gap: 0; height: calc(100vh - 100px); }
        .chat-sidebar { display: flex; flex-direction: column; border-radius: var(--radius-lg) 0 0 var(--radius-lg); overflow: hidden; }
        .chat-main { display: flex; flex-direction: column; background: var(--bg-card); border: 1px solid var(--border-color); border-left: none; border-radius: 0 var(--radius-lg) var(--radius-lg) 0; overflow: hidden; }
        .messages-area { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px; }
        .message { display: flex; gap: 12px; align-items: flex-start; }
        .message-avatar { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
        .message-content { flex: 1; padding: 10px 14px; border-radius: 10px; min-width: 0; }
        .message.user .message-content { background: var(--bg-tertiary); }
        .message.assistant .message-content { background: rgba(99, 102, 241, 0.06); border: 1px solid rgba(99, 102, 241, 0.1); }
        .chat-input-area { display: flex; gap: 10px; padding: 16px; border-top: 1px solid var(--border-color); }
        @media (max-width: 768px) { .chat-layout { grid-template-columns: 1fr; } .chat-sidebar { display: none; } }
      `}</style>
    </div>
  );
}
