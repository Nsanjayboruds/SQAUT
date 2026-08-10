export interface AIProviderConfig {
  name: string;
  type: string;
  baseUrl: string;
  apiKey?: string;
  modelName: string;
}

export interface ReviewRequest {
  code: string;
  template: 'SECURITY' | 'PERFORMANCE' | 'CODE_QUALITY';
  fileContext?: string;
}

export interface ReviewResult {
  summary: string;
  issues: ReviewIssue[];
  recommendations: string[];
}

export interface ReviewIssue {
  title: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  file?: string;
  line?: number;
  recommendation: string;
}

export interface ChatRequest {
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
}

export interface ChatResponse {
  content: string;
}

export interface DocumentationRequest {
  code: string;
  type: 'README' | 'SETUP_GUIDE' | 'API_DOCUMENTATION';
}

export interface ArchitectureAnalysis {
  frontend: string;
  backend: string;
  database: string;
  authentication: string;
  dataFlow: string;
  strengths: string[];
  risks: string[];
  recommendations: string[];
}
