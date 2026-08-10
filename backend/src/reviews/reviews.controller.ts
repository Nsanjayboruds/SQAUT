import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';

@Controller()
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('reviews')
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.createReview(user.sub, dto);
  }

  @Get('reviews')
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('template') template?: string,
    @Query('projectId') projectId?: string,
    @Query('search') search?: string,
  ) {
    return this.reviewsService.findAllByUser(user.sub, { template, projectId, search });
  }

  @Get('reviews/:id')
  async findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.reviewsService.findOne(id, user.sub);
  }

  @Get('projects/:projectId/reviews')
  async findByProject(
    @CurrentUser() user: JwtPayload,
    @Param('projectId') projectId: string,
  ) {
    return this.reviewsService.findByProject(projectId, user.sub);
  }
}
