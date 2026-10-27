import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePostDto } from './dto/create-post.dto';
import { PostQueryDto } from './dto/post-query.dto';
import { PostsService } from './posts.service';

@ApiTags('Posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @ApiOperation({ summary: 'Create a new public post' })
  @ApiBearerAuth('bearer')
  @ApiResponse({ status: 201, description: 'Post created' })
  @UseGuards(JwtAuthGuard)
  @Post()
  async createPost(
    @CurrentUser('id') userId: string,
    @Body() createDto: CreatePostDto
  ) {
    return this.postsService.createPost(userId, createDto);
  }

  @ApiOperation({
    summary: 'Public feed: List all posts (paginated)',
    description: 'Chronologically sorted via createdAt_-1 index.',
  })
  @ApiResponse({ status: 200, description: 'Paginated public post feed' })
  @Get()
  async listAllPosts(@Query() pagination: PostQueryDto) {
    return this.postsService.findAllPaginated(pagination);
  }

  @ApiOperation({
    summary: 'Scenario 2: Retrieve all posts belonging to a particular user ($lookup)',
    description:
      'Single aggregation pipeline matching user author ID (leveraging author_1_createdAt_-1 index) and joining author metadata via a $lookup stage.',
  })
  @ApiResponse({ status: 200, description: 'Posts belonging to the user with populated author' })
  @Get('user/:userId')
  async getPostsByUser(@Param('userId') userId: string) {
    return this.postsService.findByUser(userId);
  }

  @ApiOperation({ summary: 'Get single post by ID' })
  @ApiResponse({ status: 200, description: 'Post returned' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @Get(':id')
  async getPostById(@Param('id') id: string) {
    return this.postsService.findById(id);
  }
}
