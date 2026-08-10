import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { FilesService } from '../files/files.service';
import { AIService } from '../ai/ai.service';
import { AIProvidersService } from '../ai/ai-providers.service';
import { CreateChatSessionDto, SendMessageDto } from './dto/chat.dto';

const MAX_CONTEXT_FILES = 10;
const MAX_CONTEXT_LENGTH = 15000;

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly projectsService: ProjectsService,
    private readonly filesService: FilesService,
    private readonly aiService: AIService,
    private readonly aiProvidersService: AIProvidersService,
  ) {}

  async createSession(userId: string, dto: CreateChatSessionDto) {
    await this.projectsService.verifyOwnership(dto.projectId, userId);

    return this.prisma.chatSession.create({
      data: {
        userId,
        projectId: dto.projectId,
        title: dto.title || 'New Chat',
      },
    });
  }

  async getSessions(userId: string, projectId: string) {
    await this.projectsService.verifyOwnership(projectId, userId);

    return this.prisma.chatSession.findMany({
      where: { userId, projectId },
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { messages: true } } },
    });
  }

  async getMessages(sessionId: string, userId: string) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) throw new BadRequestException('Session not found');
    if (session.userId !== userId) throw new BadRequestException('Access denied');

    return this.prisma.message.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async sendMessage(sessionId: string, userId: string, dto: SendMessageDto) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) throw new BadRequestException('Session not found');
    if (session.userId !== userId) throw new BadRequestException('Access denied');

    // Save user message
    await this.prisma.message.create({
      data: {
        sessionId,
        role: 'user',
        content: dto.content,
      },
    });

    // Get provider config
    const providerConfig = await this.aiProvidersService.getProviderConfig(
      dto.providerId,
      userId,
    );

    // Get relevant code context
    const codeContext = await this.getRelevantContext(
      session.projectId,
      dto.content,
    );

    // Get message history (last 10 messages for context)
    const history = await this.prisma.message.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });

    // Call AI
    const response = await this.aiService.chat(
      providerConfig,
      history.map((m) => ({ role: m.role, content: m.content })),
      codeContext,
    );

    // Save assistant response
    const assistantMessage = await this.prisma.message.create({
      data: {
        sessionId,
        role: 'assistant',
        content: response.content,
      },
    });

    // Update session title if first message
    if (history.length <= 1) {
      await this.prisma.chatSession.update({
        where: { id: sessionId },
        data: {
          title: dto.content.substring(0, 100),
          updatedAt: new Date(),
        },
      });
    } else {
      await this.prisma.chatSession.update({
        where: { id: sessionId },
        data: { updatedAt: new Date() },
      });
    }

    return assistantMessage;
  }

  /**
   * Simple keyword-based context retrieval.
   * Finds files whose paths or content match keywords from the question.
   */
  private async getRelevantContext(
    projectId: string,
    question: string,
  ): Promise<string> {
    const allFiles = await this.filesService.getAllFiles(projectId);

    if (!allFiles.length) return 'No files available in this project.';

    // Extract keywords from the question
    const keywords = question
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2);

    // Score files by relevance
    const scored = allFiles.map((file) => {
      let score = 0;
      const pathLower = file.path.toLowerCase();
      const contentLower = file.content.toLowerCase();

      for (const keyword of keywords) {
        if (pathLower.includes(keyword)) score += 3;
        if (file.name.toLowerCase().includes(keyword)) score += 5;
        // Count content matches (cap at 5 to avoid bias to large files)
        const matches = contentLower.split(keyword).length - 1;
        score += Math.min(matches, 5);
      }

      return { file, score };
    });

    // Sort by score and take top files
    scored.sort((a, b) => b.score - a.score);
    const topFiles = scored.slice(0, MAX_CONTEXT_FILES);

    // If no files match, include key project files
    if (topFiles.every((f) => f.score === 0)) {
      const keyFiles = allFiles.filter((f) =>
        ['readme', 'package.json', 'main', 'app', 'index', 'config'].some(
          (k) => f.name.toLowerCase().includes(k),
        ),
      );
      topFiles.length = 0;
      topFiles.push(...keyFiles.slice(0, MAX_CONTEXT_FILES).map((f) => ({ file: f, score: 0 })));
    }

    // Build context string
    let context = '';
    for (const { file } of topFiles) {
      const block = `\n--- ${file.path} ---\n${file.content}\n`;
      if (context.length + block.length > MAX_CONTEXT_LENGTH) break;
      context += block;
    }

    return context || 'No relevant files found.';
  }
}
