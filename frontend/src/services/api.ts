import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor — unwrap { data } envelope and handle auth errors
api.interceptors.response.use(
  (response) => {
    // Unwrap the API envelope: { data, statusCode, timestamp }
    return response.data?.data !== undefined ? { ...response, data: response.data.data } : response;
  },
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        // Don't redirect if already on auth pages
        if (!currentPath.startsWith('/login') && !currentPath.startsWith('/register')) {
          localStorage.removeItem('accessToken');
          window.location.href = '/login';
        }
      }
    }
    // Extract error message from API response
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(Array.isArray(message) ? message.join(', ') : message));
  },
);

export default api;
