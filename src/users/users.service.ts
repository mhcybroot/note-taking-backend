import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';
import { CreateUserByAdminDto } from './dto/create-user-by-admin.dto';
import { UpdateUserByAdminDto } from './dto/update-user-by-admin.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersRepository } from './repositories/users.repository';
import { UserResponse, UserViewModel } from './view-models/user.view-model';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async createUser(dto: CreateUserByAdminDto): Promise<UserResponse> {
    const existing = await this.usersRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.usersRepository.create({
      email: dto.email.toLowerCase().trim(),
      password: hashedPassword,
      name: dto.name.trim(),
      role: dto.role || 'user',
      interests: dto.interests || [],
    });

    return UserViewModel.toViewModel(user);
  }

  async findAllPaginated(
    pagination: PaginationQueryDto
  ): Promise<PaginatedResponse<UserResponse>> {
    const result = await this.usersRepository.findAllPaginated(pagination);
    return {
      items: UserViewModel.toViewModelList(result.items),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  async findById(id: string): Promise<UserResponse> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    return UserViewModel.toViewModel(user);
  }

  async updateProfile(id: string, dto: UpdateUserDto): Promise<UserResponse> {
    const updated = await this.usersRepository.updateById(id, dto);
    if (!updated) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    return UserViewModel.toViewModel(updated);
  }

  async updateUserByAdmin(
    id: string,
    dto: UpdateUserByAdminDto
  ): Promise<UserResponse> {
    const updated = await this.usersRepository.updateById(id, dto);
    if (!updated) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    return UserViewModel.toViewModel(updated);
  }

  async deleteUser(id: string): Promise<{ deleted: boolean }> {
    const deleted = await this.usersRepository.deleteById(id);
    if (!deleted) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    return { deleted: true };
  }

  async groupByInterests(): Promise<any[]> {
    return this.usersRepository.groupByInterests();
  }
}
