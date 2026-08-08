import api from './api';
import type { Project, CreateProjectInput } from '@/types/project';

export const projectService = {
  async getAll(): Promise<Project[]> {
    const response = await api.get('/projects');
    return response.data;
  },

  async getById(id: string): Promise<Project> {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },

  async create(input: CreateProjectInput): Promise<Project> {
    const response = await api.post('/projects', input);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/projects/${id}`);
  },
};
