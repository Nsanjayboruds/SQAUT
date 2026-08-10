import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { ProjectsModule } from '../projects/projects.module';
import { FilesModule } from '../files/files.module';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [ProjectsModule, FilesModule, AIModule],
  controllers: [ReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
