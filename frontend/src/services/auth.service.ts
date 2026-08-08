import api from './api';
import type { AuthResponse, RegisterInput, LoginInput, User } from '@/types/auth';

export const authService = {
  async register(input: RegisterInput): Promise<AuthResponse> {
    const response = await api.post('/auth/register', input);
    return response.data;
  },

  async login(input: LoginInput): Promise<AuthResponse> {
    const response = await api.post('/auth/login', input);
    return response.data;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('accessToken');
    }
  },

  async getProfile(): Promise<User> {
    const response = await api.get('/auth/me');
    return response.data;
  },
};
