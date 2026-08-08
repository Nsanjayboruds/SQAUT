import api from './api';
import type { FileInfo, FileContent, UploadResult } from '@/types/file';

export const fileService = {
  async getFileTree(projectId: string): Promise<FileInfo[]> {
    const response = await api.get(`/projects/${projectId}/files`);
    return response.data;
  },

  async getFileContent(projectId: string, fileId: string): Promise<FileContent> {
    const response = await api.get(`/projects/${projectId}/files/${fileId}`);
    return response.data;
  },

  async uploadZip(projectId: string, file: File): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/projects/${projectId}/files/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
