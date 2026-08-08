import {
  Injectable,
  BadRequestException,
  Logger,
  PayloadTooLargeException,
} from '@nestjs/common';
import * as path from 'path';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import AdmZip = require('adm-zip');
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import {
  shouldIgnorePath,
  shouldProcessFile,
  detectLanguage,
  isPathSafe,
  FILE_LIMITS,
} from '../common/utils/file-filter.util';

interface ExtractedFile {
  path: string;
  name: string;
  extension: string;
  language: string | null;
  content: string;
  size: number;
}

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly projectsService: ProjectsService,
  ) {}

  /**
   * Process a ZIP file upload: validate, extract, store files in DB.
   */
  async processZipUpload(
    projectId: string,
    userId: string,
    buffer: Buffer,
  ) {
    // Verify project ownership
    await this.projectsService.verifyOwnership(projectId, userId);

    // Validate ZIP size
    if (buffer.length > FILE_LIMITS.MAX_ZIP_SIZE) {
      throw new PayloadTooLargeException(
        `ZIP file too large. Maximum size is ${FILE_LIMITS.MAX_ZIP_SIZE / 1024 / 1024}MB`,
      );
    }

    // Parse ZIP
    let zip: AdmZip;
    try {
      zip = new AdmZip(buffer);
    } catch {
      throw new BadRequestException('Invalid ZIP file');
    }

    const entries = zip.getEntries();
    const extractedFiles: ExtractedFile[] = [];
    let skippedCount = 0;

    for (const entry of entries) {
      // Skip directories
      if (entry.isDirectory) continue;

      const entryPath = entry.entryName;

      // Path traversal protection
      if (!isPathSafe(entryPath)) {
        this.logger.warn(`Blocked path traversal attempt: ${entryPath}`);
        skippedCount++;
        continue;
      }

      // Skip ignored directories
      if (shouldIgnorePath(entryPath)) {
        skippedCount++;
        continue;
      }

      // Skip unsupported files
      if (!shouldProcessFile(entryPath)) {
        skippedCount++;
        continue;
      }

      // Skip files that are too large
      if (entry.header.size > FILE_LIMITS.MAX_FILE_SIZE) {
        this.logger.debug(`Skipped large file: ${entryPath} (${entry.header.size} bytes)`);
        skippedCount++;
        continue;
      }

      // Enforce file count limit
      if (extractedFiles.length >= FILE_LIMITS.MAX_FILES) {
        this.logger.warn(`File limit reached (${FILE_LIMITS.MAX_FILES}), stopping extraction`);
        break;
      }

      try {
        const content = entry.getData().toString('utf-8');
        // Strip any leading directory prefix (e.g., "project-name/src/..." → "src/...")
        const normalizedPath = this.stripRootDir(entryPath);
        const fileName = path.basename(normalizedPath);
        const ext = path.extname(normalizedPath);

        extractedFiles.push({
          path: normalizedPath,
          name: fileName,
          extension: ext,
          language: detectLanguage(normalizedPath),
          content,
          size: Buffer.byteLength(content, 'utf-8'),
        });
      } catch (err) {
        this.logger.debug(`Failed to read file ${entryPath}: ${err}`);
        skippedCount++;
      }
    }

    if (extractedFiles.length === 0) {
      throw new BadRequestException(
        'No supported source files found in the ZIP archive',
      );
    }

    // Delete existing files for this project (replace on re-upload)
    await this.prisma.file.deleteMany({ where: { projectId } });

    // Bulk insert files
    await this.prisma.file.createMany({
      data: extractedFiles.map((f) => ({
        projectId,
        path: f.path,
        name: f.name,
        extension: f.extension,
        language: f.language,
        content: f.content,
        size: f.size,
      })),
    });

    // Update project timestamp
    await this.prisma.project.update({
      where: { id: projectId },
      data: { updatedAt: new Date() },
    });

    return {
      filesProcessed: extractedFiles.length,
      filesSkipped: skippedCount,
      files: extractedFiles.map((f) => ({
        path: f.path,
        name: f.name,
        language: f.language,
        size: f.size,
      })),
    };
  }

  /**
   * Get file tree for a project (just paths + metadata, no content).
   */
  async getFileTree(projectId: string, userId: string) {
    await this.projectsService.verifyOwnership(projectId, userId);

    return this.prisma.file.findMany({
      where: { projectId },
      select: {
        id: true,
        path: true,
        name: true,
        extension: true,
        language: true,
        size: true,
      },
      orderBy: { path: 'asc' },
    });
  }

  /**
   * Get a single file's content.
   */
  async getFileContent(fileId: string, projectId: string, userId: string) {
    await this.projectsService.verifyOwnership(projectId, userId);

    const file = await this.prisma.file.findFirst({
      where: { id: fileId, projectId },
    });

    if (!file) {
      throw new BadRequestException('File not found');
    }

    return file;
  }

  /**
   * Get files by their IDs (for reviews).
   */
  async getFilesByIds(fileIds: string[], projectId: string) {
    return this.prisma.file.findMany({
      where: {
        id: { in: fileIds },
        projectId,
      },
    });
  }

  /**
   * Get all files for a project (for project-wide reviews).
   */
  async getAllFiles(projectId: string) {
    return this.prisma.file.findMany({
      where: { projectId },
      orderBy: { path: 'asc' },
    });
  }

  /**
   * Strip the root directory prefix from paths.
   * e.g., "my-project/src/main.ts" → "src/main.ts"
   */
  private stripRootDir(filePath: string): string {
    const parts = filePath.split('/').filter(Boolean);
    if (parts.length <= 1) return filePath;

    // Check if all files share a common root directory
    // For simplicity, always strip the first directory if it looks like a project root
    return parts.slice(1).join('/') || parts[0];
  }
}
