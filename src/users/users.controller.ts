import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CreateUserByAdminDto } from './dto/create-user-by-admin.dto';
import { UpdateUserByAdminDto } from './dto/update-user-by-admin.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Scenario 1: Group by interests view
  @Get('by-interests')
  async getGroupByInterests() {
    return this.usersService.groupByInterests();
  }

  // User self-profile operations
  @Get('me')
  async getMyProfile(@CurrentUser('id') userId: string) {
    return this.usersService.findById(userId);
  }

  @Patch('me')
  async updateMyProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateUserDto
  ) {
    return this.usersService.updateProfile(userId, dto);
  }

  // Admin User Management Operations
  @Roles('admin')
  @Post()
  async createUserByAdmin(@Body() dto: CreateUserByAdminDto) {
    return this.usersService.createUser(dto);
  }

  @Roles('admin')
  @Get()
  async listAllUsers(@Query() pagination: PaginationQueryDto) {
    return this.usersService.findAllPaginated(pagination);
  }

  @Roles('admin')
  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Roles('admin')
  @Patch(':id')
  async updateUserByAdmin(
    @Param('id') id: string,
    @Body() dto: UpdateUserByAdminDto
  ) {
    return this.usersService.updateUserByAdmin(id, dto);
  }

  @Roles('admin')
  @Delete(':id')
  async deleteUserByAdmin(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }
}
