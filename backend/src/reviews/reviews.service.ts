import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { FilesService } from '../files/files.service';
import { AIService } from '../ai/ai.service';
import { AIProvidersService } from '../ai/ai-providers.service';
import { CreateReviewDto } from './dto/create-review.dto';

const MAX_CONTEXT_LENGTH = 30000; // ~30K characters max context for AI

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly projectsService: ProjectsService,
    private readonly filesService: FilesService,
    private readonly aiService: AIService,
    private readonly aiProvidersService: AIProvidersService,
  ) {}

  async createReview(userId: string, dto: CreateReviewDto) {
    // Verify project ownership
    await this.projectsService.verifyOwnership(dto.projectId, userId);

    // Get provider config
    const providerConfig = await this.aiProvidersService.getProviderConfig(
      dto.providerId,
      userId,
    );

    // Gather code context based on scope
    let codeContext: string;
    let fileIds: string[] = [];

    switch (dto.scope) {
      case 'FILE': {
        if (!dto.fileIds?.length) {
          throw new BadRequestException('File ID required for single file review');
        }
        const files = await this.filesService.getFilesByIds(
          [dto.fileIds[0]],
          dto.projectId,
        );
        if (!files.length) throw new BadRequestException('File not found');
        codeContext = `// File: ${files[0].path}\n${files[0].content}`;
        fileIds = [files[0].id];
        break;
      }
      case 'MULTI_FILE': {
        if (!dto.fileIds?.length) {
          throw new BadRequestException('File IDs required for multi-file review');
        }
        const files = await this.filesService.getFilesByIds(
          dto.fileIds,
          dto.projectId,
        );
        codeContext = this.buildCodeContext(
          files.map((f) => ({ path: f.path, content: f.content })),
        );
        fileIds = files.map((f) => f.id);
        break;
      }
      case 'PROJECT': {
        const files = await this.filesService.getAllFiles(dto.projectId);
        codeContext = this.buildCodeContext(
          files.map((f) => ({ path: f.path, content: f.content })),
        );
        fileIds = [];
        break;
      }
      default:
        throw new BadRequestException('Invalid scope');
    }

    // Call AI for review
    let summary = '';
    let resultJson: any;

    if (dto.template === 'ARCHITECTURE') {
      const archResult = await this.aiService.analyzeArchitecture(providerConfig, codeContext);
      summary = 'Project Architecture Analysis completed.';
      resultJson = archResult;
    } else if (dto.template === 'DOCUMENTATION') {
      const docResult = await this.aiService.generateDocumentation(providerConfig, codeContext, 'README');
      summary = 'Project Documentation (README) generated.';
      resultJson = { markdown: docResult };
    } else {
      const template = dto.template as 'SECURITY' | 'PERFORMANCE' | 'CODE_QUALITY';
      const reviewResult = await this.aiService.reviewCode(providerConfig, codeContext, template);
      summary = reviewResult.summary;
      resultJson = reviewResult;
    }

    // Store the review
    const review = await this.prisma.review.create({
      data: {
        projectId: dto.projectId,
        userId,
        providerId: dto.providerId,
        template: dto.template,
        scope: dto.scope,
        fileIds,
        summary,
        result: resultJson,
      },
    });

    return review;
  }

  async findAllByUser(userId: string, query?: { template?: string; projectId?: string; search?: string }) {
    const where: Record<string, unknown> = { userId };

    if (query?.template) where.template = query.template;
    if (query?.projectId) where.projectId = query.projectId;

    const reviews = await this.prisma.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        project: { select: { name: true } },
      },
    });

    if (query?.search) {
      const searchLower = query.search.toLowerCase();
      return reviews.filter(
        (r) =>
          r.summary.toLowerCase().includes(searchLower) ||
          r.project.name.toLowerCase().includes(searchLower),
      );
    }

    return reviews;
  }

  async findOne(id: string, userId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: {
        project: { select: { name: true } },
      },
    });

    if (!review) throw new BadRequestException('Review not found');
    if (review.userId !== userId) throw new BadRequestException('Access denied');

    return review;
  }

  async findByProject(projectId: string, userId: string) {
    await this.projectsService.verifyOwnership(projectId, userId);

    return this.prisma.review.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Build code context from multiple files, respecting size limits */
  private buildCodeContext(
    files: { path: string; content: string }[],
  ): string {
    let context = '';
    for (const file of files) {
      const fileBlock = `\n// ===== File: ${file.path} =====\n${file.content}\n`;
      if (context.length + fileBlock.length > MAX_CONTEXT_LENGTH) {
        // Add truncation note
        context += `\n// ... (${files.length - files.indexOf(file)} more files truncated due to size limits)\n`;
        break;
      }
      context += fileBlock;
    }
    return context;
  }
}
