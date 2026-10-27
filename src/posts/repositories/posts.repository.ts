import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import { Post, PostDocument } from '../schemas/post.schema';

@Injectable()
export class PostsRepository {
  constructor(
    @InjectModel(Post.name) private readonly postModel: Model<PostDocument>
  ) {}

  async create(postData: {
    title: string;
    content: string;
    author: Types.ObjectId;
  }): Promise<PostDocument> {
    const createdPost = new this.postModel(postData);
    return createdPost.save();
  }

  async findById(id: string): Promise<PostDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.postModel.findById(id).populate('author', 'name email').exec();
  }

  // Utilizes index: { createdAt: -1 }
  async findAllPaginated(
    pagination: PaginationQueryDto
  ): Promise<PaginatedResponse<PostDocument>> {
    const { page, limit, skip, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const sortDirection = sortOrder === 'asc' || sortOrder === '1' ? 1 : -1;

    const [items, total] = await Promise.all([
      this.postModel
        .find()
        .populate('author', 'name email')
        .sort({ [sortBy]: sortDirection })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.postModel.countDocuments().exec(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  // Scenario 2: Single aggregation pipeline with $lookup stage
  // Utilizes compound index: { author: 1, createdAt: -1 }
  async findByUserWithLookup(userId: string): Promise<any[]> {
    const authorObjectId = Types.ObjectId.isValid(userId)
      ? new Types.ObjectId(userId)
      : null;

    if (!authorObjectId) return [];

    return this.postModel
      .aggregate([
        { $match: { author: authorObjectId } },
        { $sort: { createdAt: -1 } },
        {
          $lookup: {
            from: 'users',
            localField: 'author',
            foreignField: '_id',
            as: 'author',
            pipeline: [
              {
                $project: {
                  _id: 1,
                  name: 1,
                  email: 1,
                },
              },
            ],
          },
        },
        { $unwind: '$author' },
        {
          $project: {
            _id: 0,
            id: '$_id',
            title: 1,
            content: 1,
            author: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ])
      .exec();
  }
}
