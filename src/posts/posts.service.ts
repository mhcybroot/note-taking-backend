import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';
import { CreatePostDto } from './dto/create-post.dto';
import { PostsRepository } from './repositories/posts.repository';
import { PostResponse, PostViewModel } from './view-models/post.view-model';

@Injectable()
export class PostsService {
  constructor(private readonly postsRepository: PostsRepository) {}

  async createPost(
    userId: string,
    createDto: CreatePostDto
  ): Promise<PostResponse> {
    const post = await this.postsRepository.create({
      title: createDto.title,
      content: createDto.content,
      author: new Types.ObjectId(userId),
    });
    return PostViewModel.toViewModel(post);
  }

  async findAllPaginated(
    pagination: PaginationQueryDto
  ): Promise<PaginatedResponse<PostResponse>> {
    const result = await this.postsRepository.findAllPaginated(pagination);
    return {
      items: PostViewModel.toViewModelList(result.items),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  async findById(id: string): Promise<PostResponse> {
    const post = await this.postsRepository.findById(id);
    if (!post) {
      throw new NotFoundException(`Post with ID "${id}" not found`);
    }
    return PostViewModel.toViewModel(post);
  }

  // Scenario 2: Aggregation with $lookup
  async findByUser(userId: string): Promise<any[]> {
    return this.postsRepository.findByUserWithLookup(userId);
  }
}
