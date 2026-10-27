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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CreateUserByAdminDto } from './dto/create-user-by-admin.dto';
import { UpdateUserByAdminDto } from './dto/update-user-by-admin.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({
    summary: 'Scenario 1: Group users by interests view',
    description:
      'Aggregates all user profiles by interests using exactly one collection.aggregate() call, supported by the interests_1 multikey index.',
  })
  @ApiResponse({ status: 200, description: 'List of interest buckets with associated users' })
  @Get('by-interests')
  async getGroupByInterests() {
    return this.usersService.groupByInterests();
  }

  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Self profile returned' })
  @Get('me')
  async getMyProfile(@CurrentUser('id') userId: string) {
    return this.usersService.findById(userId);
  }

  @ApiOperation({ summary: 'Update current user profile (name, interests)' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  @Patch('me')
  async updateMyProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateUserDto
  ) {
    return this.usersService.updateProfile(userId, dto);
  }

  @ApiOperation({
    summary: 'Admin: Add a new user with explicit role and initial password',
    description: 'Requires Admin role.',
  })
  @ApiResponse({ status: 201, description: 'User created by admin' })
  @ApiResponse({ status: 403, description: 'Forbidden (non-admin)' })
  @Roles('admin')
  @Post()
  async createUserByAdmin(@Body() dto: CreateUserByAdminDto) {
    return this.usersService.createUser(dto);
  }

  @ApiOperation({
    summary: 'Admin: List all registered users (paginated)',
    description: 'Requires Admin role. Chronologically sorted via createdAt_-1 index.',
  })
  @ApiResponse({ status: 200, description: 'Paginated user list' })
  @ApiResponse({ status: 403, description: 'Forbidden (non-admin)' })
  @Roles('admin')
  @Get()
  async listAllUsers(@Query() pagination: PaginationQueryDto) {
    return this.usersService.findAllPaginated(pagination);
  }

  @ApiOperation({ summary: 'Admin: Get user by ID' })
  @ApiResponse({ status: 200, description: 'User returned' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Roles('admin')
  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @ApiOperation({ summary: 'Admin: Update user role or profile' })
  @ApiResponse({ status: 200, description: 'User updated' })
  @Roles('admin')
  @Patch(':id')
  async updateUserByAdmin(
    @Param('id') id: string,
    @Body() dto: UpdateUserByAdminDto
  ) {
    return this.usersService.updateUserByAdmin(id, dto);
  }

  @ApiOperation({ summary: 'Admin: Delete user account' })
  @ApiResponse({ status: 200, description: 'User deleted' })
  @Roles('admin')
  @Delete(':id')
  async deleteUserByAdmin(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }
}
