import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>
  ) {}

  async create(userData: Partial<User>): Promise<UserDocument> {
    const createdUser = new this.userModel(userData);
    return createdUser.save();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase().trim() }).exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.userModel.findById(id).exec();
  }

  async findAllPaginated(
    pagination: PaginationQueryDto
  ): Promise<PaginatedResponse<UserDocument>> {
    const { page, limit, skip, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const sortDirection = sortOrder === 'asc' || sortOrder === '1' ? 1 : -1;

    const [items, total] = await Promise.all([
      this.userModel
        .find()
        .sort({ [sortBy]: sortDirection })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments().exec(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async updateById(
    id: string,
    updateData: Partial<User>
  ): Promise<UserDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.userModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .exec();
  }

  async deleteById(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;
    const result = await this.userModel.findByIdAndDelete(id).exec();
    return !!result;
  }

  async groupByInterests(): Promise<any[]> {
    return this.userModel
      .aggregate([
        // Multikey index supported match on interests
        { $match: { interests: { $exists: true, $ne: [] } } },
        { $unwind: '$interests' },
        {
          $group: {
            _id: '$interests',
            count: { $sum: 1 },
            users: {
              $addToSet: {
                id: '$_id',
                name: '$name',
                email: '$email',
                role: '$role',
              },
            },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            _id: 0,
            interest: '$_id',
            count: 1,
            users: 1,
          },
        },
      ])
      .exec();
  }
}
