import { Module } from '@nestjs/common';
import { AIService } from './ai.service';
import { AIProvidersService } from './ai-providers.service';
import { AIProvidersController } from './ai-providers.controller';

@Module({
  controllers: [AIProvidersController],
  providers: [AIService, AIProvidersService],
  exports: [AIService, AIProvidersService],
})
export class AIModule {}
