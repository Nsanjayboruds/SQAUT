import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ProjectsModule } from '../projects/projects.module';
import { FilesModule } from '../files/files.module';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [ProjectsModule, FilesModule, AIModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
