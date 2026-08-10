import api from './api';

export interface ChatSession {
  id: string;
  projectId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  _count?: { messages: number };
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export const chatService = {
  async getSessions(projectId: string): Promise<ChatSession[]> {
    const response = await api.get(`/projects/${projectId}/chat/sessions`);
    return response.data;
  },

  async createSession(projectId: string, title?: string): Promise<ChatSession> {
    const response = await api.post('/chat/sessions', { projectId, title });
    return response.data;
  },

  async getMessages(sessionId: string): Promise<ChatMessage[]> {
    const response = await api.get(`/chat/sessions/${sessionId}/messages`);
    return response.data;
  },

  async sendMessage(sessionId: string, content: string, providerId: string): Promise<ChatMessage> {
    const response = await api.post(`/chat/sessions/${sessionId}/messages`, { content, providerId });
    return response.data;
  },
};
