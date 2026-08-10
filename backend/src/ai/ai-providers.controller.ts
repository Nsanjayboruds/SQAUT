import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { AIProvidersService } from './ai-providers.service';
import { AIService } from './ai.service';
import { CreateProviderDto, UpdateProviderDto } from './dto/provider.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';

@Controller('ai/providers')
@UseGuards(JwtAuthGuard)
export class AIProvidersController {
  constructor(
    private readonly providersService: AIProvidersService,
    private readonly aiService: AIService,
  ) {}

  @Post()
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateProviderDto,
  ) {
    return this.providersService.create(user.sub, dto);
  }

  @Get()
  async findAll(@CurrentUser() user: JwtPayload) {
    return this.providersService.findAllByUser(user.sub);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.providersService.findOneByUser(id, user.sub);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateProviderDto,
  ) {
    return this.providersService.update(id, user.sub, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.providersService.delete(id, user.sub);
  }

  @Post(':id/test')
  @HttpCode(HttpStatus.OK)
  async testConnection(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    const config = await this.providersService.getProviderConfig(id, user.sub);
    try {
      const result = await this.aiService.testConnection(config);
      return { success: true, message: result };
    } catch (err) {
      throw new BadRequestException(
        `Connection failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      );
    }
  }
}
