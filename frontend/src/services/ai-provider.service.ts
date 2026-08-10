import api from './api';

export interface AIProvider {
  id: string;
  name: string;
  type: string;
  baseUrl: string;
  modelName: string;
  hasApiKey: boolean;
  isDefault: boolean;
  createdAt: string;
}

export interface CreateProviderInput {
  name: string;
  type: string;
  baseUrl: string;
  apiKey?: string;
  modelName: string;
}

export const aiProviderService = {
  async getAll(): Promise<AIProvider[]> {
    const response = await api.get('/ai/providers');
    return response.data;
  },

  async create(input: CreateProviderInput): Promise<AIProvider> {
    const response = await api.post('/ai/providers', input);
    return response.data;
  },

  async update(id: string, input: Partial<CreateProviderInput>): Promise<AIProvider> {
    const response = await api.patch(`/ai/providers/${id}`, input);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/ai/providers/${id}`);
  },

  async testConnection(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post(`/ai/providers/${id}/test`);
    return response.data;
  },
};
