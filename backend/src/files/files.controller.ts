import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { FILE_LIMITS } from '../common/utils/file-filter.util';

@Controller('projects/:projectId/files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: FILE_LIMITS.MAX_ZIP_SIZE },
      fileFilter: (_req, file, cb) => {
        const allowedMimes = [
          'application/zip',
          'application/x-zip-compressed',
          'application/x-zip',
          'multipart/x-zip',
        ];
        if (!allowedMimes.includes(file.mimetype)) {
          cb(new BadRequestException('Only ZIP files are allowed'), false);
        } else {
          cb(null, true);
        }
      },
    }),
  )
  async uploadZip(
    @CurrentUser() user: JwtPayload,
    @Param('projectId') projectId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.filesService.processZipUpload(projectId, user.sub, file.buffer);
  }

  @Get()
  async getFileTree(
    @CurrentUser() user: JwtPayload,
    @Param('projectId') projectId: string,
  ) {
    return this.filesService.getFileTree(projectId, user.sub);
  }

  @Get(':fileId')
  async getFileContent(
    @CurrentUser() user: JwtPayload,
    @Param('projectId') projectId: string,
    @Param('fileId') fileId: string,
  ) {
    return this.filesService.getFileContent(fileId, projectId, user.sub);
  }
}
