import api from './api';

export interface Review {
  id: string;
  projectId: string;
  template: string;
  scope: string;
  summary: string;
  result: {
    summary: string;
    issues: { title: string; description: string; severity: string; file?: string; recommendation: string }[];
    recommendations: string[];
  };
  createdAt: string;
  project?: { name: string };
}

export interface CreateReviewInput {
  projectId: string;
  template: string;
  scope: string;
  fileIds?: string[];
  providerId: string;
}

export const reviewService = {
  async getAll(params?: { template?: string; projectId?: string; search?: string }): Promise<Review[]> {
    const response = await api.get('/reviews', { params });
    return response.data;
  },

  async getById(id: string): Promise<Review> {
    const response = await api.get(`/reviews/${id}`);
    return response.data;
  },

  async getByProject(projectId: string): Promise<Review[]> {
    const response = await api.get(`/projects/${projectId}/reviews`);
    return response.data;
  },

  async create(input: CreateReviewInput): Promise<Review> {
    const response = await api.post('/reviews', input);
    return response.data;
  },
};
