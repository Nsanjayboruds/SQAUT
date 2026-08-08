export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    files: number;
    reviews: number;
    chatSessions?: number;
  };
}

export interface CreateProjectInput {
  name: string;
  description?: string;
}
