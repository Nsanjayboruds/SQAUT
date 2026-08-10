import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateChatSessionDto, SendMessageDto } from './dto/chat.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';

@Controller()
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('chat/sessions')
  async createSession(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateChatSessionDto,
  ) {
    return this.chatService.createSession(user.sub, dto);
  }

  @Get('projects/:projectId/chat/sessions')
  async getSessions(
    @CurrentUser() user: JwtPayload,
    @Param('projectId') projectId: string,
  ) {
    return this.chatService.getSessions(user.sub, projectId);
  }

  @Get('chat/sessions/:sessionId/messages')
  async getMessages(
    @CurrentUser() user: JwtPayload,
    @Param('sessionId') sessionId: string,
  ) {
    return this.chatService.getMessages(sessionId, user.sub);
  }

  @Post('chat/sessions/:sessionId/messages')
  async sendMessage(
    @CurrentUser() user: JwtPayload,
    @Param('sessionId') sessionId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(sessionId, user.sub, dto);
  }
}
