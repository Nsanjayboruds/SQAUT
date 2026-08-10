import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import type {
  AIProviderConfig,
  ReviewResult,
  ReviewIssue,
  ChatResponse,
  ArchitectureAnalysis,
} from './interfaces/ai-provider.interface';
import { getSecurityPrompt } from './prompts/security.prompt';
import { getPerformancePrompt } from './prompts/performance.prompt';
import { getCodeQualityPrompt } from './prompts/code-quality.prompt';
import { getChatSystemPrompt } from './prompts/chat.prompt';
import { getDocumentationPrompt } from './prompts/documentation.prompt';
import { getArchitecturePrompt } from './prompts/architecture.prompt';

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);

  /**
   * Test connection to an AI provider.
   */
  async testConnection(config: AIProviderConfig): Promise<string> {
    const response = await this.callAPI(config, [
      { role: 'user', content: 'Respond with exactly: "Connection successful"' },
    ], 50);

    return response || 'Connection successful';
  }

  /**
   * Run a code review using the specified template.
   */
  async reviewCode(
    config: AIProviderConfig,
    code: string,
    template: 'SECURITY' | 'PERFORMANCE' | 'CODE_QUALITY',
    fileContext?: string,
  ): Promise<ReviewResult> {
    let systemPrompt: string;
    switch (template) {
      case 'SECURITY':
        systemPrompt = getSecurityPrompt();
        break;
      case 'PERFORMANCE':
        systemPrompt = getPerformancePrompt();
        break;
      case 'CODE_QUALITY':
        systemPrompt = getCodeQualityPrompt();
        break;
    }

    const userMessage = fileContext
      ? `Review the following code:\n\nFile context: ${fileContext}\n\n\`\`\`\n${code}\n\`\`\``
      : `Review the following code:\n\n\`\`\`\n${code}\n\`\`\``;

    const response = await this.callAPI(config, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ], 4000);

    return this.parseReviewResponse(response);
  }

  /**
   * Chat about code with context.
   */
  async chat(
    config: AIProviderConfig,
    messages: { role: string; content: string }[],
    codeContext: string,
  ): Promise<ChatResponse> {
    const systemPrompt = getChatSystemPrompt(codeContext);

    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    const response = await this.callAPI(config, apiMessages, 2000);
    return { content: response };
  }

  /**
   * Generate documentation.
   */
  async generateDocumentation(
    config: AIProviderConfig,
    code: string,
    type: 'README' | 'SETUP_GUIDE' | 'API_DOCUMENTATION',
  ): Promise<string> {
    const prompt = getDocumentationPrompt(type);

    return this.callAPI(config, [
      { role: 'system', content: prompt },
      { role: 'user', content: `Generate documentation for this codebase:\n\n${code}` },
    ], 3000);
  }

  /**
   * Analyze architecture.
   */
  async analyzeArchitecture(
    config: AIProviderConfig,
    code: string,
  ): Promise<ArchitectureAnalysis> {
    const prompt = getArchitecturePrompt();

    const response = await this.callAPI(config, [
      { role: 'system', content: prompt },
      { role: 'user', content: `Analyze the architecture of this codebase:\n\n${code}` },
    ], 3000);

    return this.parseArchitectureResponse(response);
  }

  /**
   * Call the OpenAI-compatible API.
   * This is the single point of contact with AI providers.
   */
  private async callAPI(
    config: AIProviderConfig,
    messages: { role: string; content: string }[],
    maxTokens: number,
  ): Promise<string> {
    const url = `${config.baseUrl.replace(/\/$/, '')}/chat/completions`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
    }

    const body = {
      model: config.modelName,
      messages,
      max_tokens: maxTokens,
      temperature: 0.3,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(120000), // 2 minute timeout
      });

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(`AI API error (${response.status}): ${errorBody}`);
        throw new BadRequestException(
          `AI provider returned error: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;

      if (!content) {
        throw new BadRequestException('AI provider returned empty response');
      }

      return content.trim();
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      this.logger.error(`AI API call failed: ${err}`);
      throw new BadRequestException(
        `Failed to connect to AI provider: ${err instanceof Error ? err.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Parse and validate the AI review response.
   * Handles malformed JSON gracefully.
   */
  private parseReviewResponse(response: string): ReviewResult {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return this.fallbackReview(response);
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]);

      // Validate structure
      const result: ReviewResult = {
        summary: typeof parsed.summary === 'string' ? parsed.summary : 'Review completed',
        issues: [],
        recommendations: [],
      };

      // Validate issues
      if (Array.isArray(parsed.issues)) {
        result.issues = parsed.issues
          .filter((issue: unknown) => typeof issue === 'object' && issue !== null)
          .map((issue: Record<string, unknown>): ReviewIssue => ({
            title: String(issue.title || 'Untitled Issue'),
            description: String(issue.description || ''),
            severity: this.validateSeverity(String(issue.severity || 'MEDIUM')),
            file: issue.file ? String(issue.file) : undefined,
            line: typeof issue.line === 'number' ? issue.line : undefined,
            recommendation: String(issue.recommendation || ''),
          }));
      }

      // Validate recommendations
      if (Array.isArray(parsed.recommendations)) {
        result.recommendations = parsed.recommendations
          .filter((r: unknown) => typeof r === 'string')
          .map((r: string) => r);
      }

      return result;
    } catch {
      return this.fallbackReview(response);
    }
  }

  /** Create a fallback review when AI returns non-JSON */
  private fallbackReview(response: string): ReviewResult {
    return {
      summary: response.substring(0, 500),
      issues: [],
      recommendations: ['The AI response was not in the expected structured format. The raw summary is provided above.'],
    };
  }

  /** Validate severity level */
  private validateSeverity(severity: string): ReviewIssue['severity'] {
    const valid = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
    const upper = severity.toUpperCase();
    return valid.includes(upper) ? (upper as ReviewIssue['severity']) : 'MEDIUM';
  }

  /** Parse architecture analysis response */
  private parseArchitectureResponse(response: string): ArchitectureAnalysis {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        frontend: '', backend: '', database: '', authentication: '',
        dataFlow: response, strengths: [], risks: [], recommendations: [],
      };
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        frontend: String(parsed.frontend || ''),
        backend: String(parsed.backend || ''),
        database: String(parsed.database || ''),
        authentication: String(parsed.authentication || ''),
        dataFlow: String(parsed.dataFlow || ''),
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(String) : [],
        risks: Array.isArray(parsed.risks) ? parsed.risks.map(String) : [],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.map(String) : [],
      };
    } catch {
      return {
        frontend: '', backend: '', database: '', authentication: '',
        dataFlow: response, strengths: [], risks: [], recommendations: [],
      };
    }
  }
}
