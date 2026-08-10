import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { encrypt, decrypt } from '../common/utils/encryption.util';
import { CreateProviderDto, UpdateProviderDto } from './dto/provider.dto';

@Injectable()
export class AIProvidersService {
  private readonly logger = new Logger(AIProvidersService.name);
  private readonly encryptionKey: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.encryptionKey = this.configService.get<string>('AI_ENCRYPTION_KEY', '');
    if (!this.encryptionKey) {
      this.logger.warn('AI_ENCRYPTION_KEY is not set. API keys will not be encrypted.');
    }
  }

  async create(userId: string, dto: CreateProviderDto) {
    const encryptedKey = dto.apiKey && this.encryptionKey
      ? encrypt(dto.apiKey, this.encryptionKey)
      : null;

    const provider = await this.prisma.aIProvider.create({
      data: {
        userId,
        name: dto.name,
        type: dto.type,
        baseUrl: dto.baseUrl,
        apiKeyEncrypted: encryptedKey?.encrypted || null,
        apiKeyIv: encryptedKey?.iv || null,
        apiKeyTag: encryptedKey?.tag || null,
        modelName: dto.modelName,
      },
    });

    return this.sanitizeProvider(provider);
  }

  async findAllByUser(userId: string) {
    const providers = await this.prisma.aIProvider.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return providers.map((p) => this.sanitizeProvider(p));
  }

  async findOneByUser(id: string, userId: string) {
    const provider = await this.prisma.aIProvider.findUnique({
      where: { id },
    });

    if (!provider) throw new NotFoundException('Provider not found');
    if (provider.userId !== userId) throw new ForbiddenException('Access denied');

    return this.sanitizeProvider(provider);
  }

  async update(id: string, userId: string, dto: UpdateProviderDto) {
    const provider = await this.prisma.aIProvider.findUnique({ where: { id } });
    if (!provider) throw new NotFoundException('Provider not found');
    if (provider.userId !== userId) throw new ForbiddenException('Access denied');

    const updateData: Record<string, unknown> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.baseUrl !== undefined) updateData.baseUrl = dto.baseUrl;
    if (dto.modelName !== undefined) updateData.modelName = dto.modelName;

    if (dto.apiKey !== undefined) {
      if (dto.apiKey && this.encryptionKey) {
        const encrypted = encrypt(dto.apiKey, this.encryptionKey);
        updateData.apiKeyEncrypted = encrypted.encrypted;
        updateData.apiKeyIv = encrypted.iv;
        updateData.apiKeyTag = encrypted.tag;
      } else {
        updateData.apiKeyEncrypted = null;
        updateData.apiKeyIv = null;
        updateData.apiKeyTag = null;
      }
    }

    const updated = await this.prisma.aIProvider.update({
      where: { id },
      data: updateData,
    });

    return this.sanitizeProvider(updated);
  }

  async delete(id: string, userId: string) {
    const provider = await this.prisma.aIProvider.findUnique({ where: { id } });
    if (!provider) throw new NotFoundException('Provider not found');
    if (provider.userId !== userId) throw new ForbiddenException('Access denied');

    await this.prisma.aIProvider.delete({ where: { id } });
    return { message: 'Provider deleted' };
  }

  /**
   * Get the decrypted API key for a provider (internal use only).
   */
  async getDecryptedKey(providerId: string): Promise<string | null> {
    const provider = await this.prisma.aIProvider.findUnique({
      where: { id: providerId },
    });

    if (!provider?.apiKeyEncrypted || !provider?.apiKeyIv || !provider?.apiKeyTag) {
      return null;
    }

    try {
      return decrypt(
        provider.apiKeyEncrypted,
        provider.apiKeyIv,
        provider.apiKeyTag,
        this.encryptionKey,
      );
    } catch (err) {
      this.logger.error(`Failed to decrypt API key for provider ${providerId}: ${err}`);
      return null;
    }
  }

  /**
   * Get provider config with decrypted key (for AI service use).
   */
  async getProviderConfig(providerId: string, userId: string) {
    const provider = await this.prisma.aIProvider.findUnique({
      where: { id: providerId },
    });

    if (!provider) throw new NotFoundException('Provider not found');
    if (provider.userId !== userId) throw new ForbiddenException('Access denied');

    const apiKey = await this.getDecryptedKey(providerId);

    return {
      name: provider.name,
      type: provider.type,
      baseUrl: provider.baseUrl,
      apiKey: apiKey || undefined,
      modelName: provider.modelName,
    };
  }

  /**
   * Get the user's default provider, or the first available one.
   */
  async getDefaultProvider(userId: string) {
    const provider = await this.prisma.aIProvider.findFirst({
      where: { userId, isDefault: true },
    });

    if (provider) return provider;

    // Fallback to first provider
    return this.prisma.aIProvider.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** Strip encrypted fields — never expose API keys in GET responses */
  private sanitizeProvider(provider: Record<string, unknown>) {
    const { apiKeyEncrypted, apiKeyIv, apiKeyTag, ...safe } = provider;
    return {
      ...safe,
      hasApiKey: !!apiKeyEncrypted,
    };
  }
}
