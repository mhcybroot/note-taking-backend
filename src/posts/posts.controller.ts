import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePostDto } from './dto/create-post.dto';
import { PostQueryDto } from './dto/post-query.dto';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createPost(
    @CurrentUser('id') userId: string,
    @Body() createDto: CreatePostDto
  ) {
    return this.postsService.createPost(userId, createDto);
  }

  @Get()
  async listAllPosts(@Query() pagination: PostQueryDto) {
    return this.postsService.findAllPaginated(pagination);
  }

  // Scenario 2: Aggregation pipeline with $lookup
  @Get('user/:userId')
  async getPostsByUser(@Param('userId') userId: string) {
    return this.postsService.findByUser(userId);
  }

  @Get(':id')
  async getPostById(@Param('id') id: string) {
    return this.postsService.findById(id);
  }
}
