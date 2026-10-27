import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole } from '../schemas/user.schema';

export class UpdateUserByAdminDto {
  @ApiPropertyOptional({ example: 'Bob Updated Name', description: 'Updated full name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: ['user', 'admin'], example: 'admin', description: 'Updated role' })
  @IsOptional()
  @IsEnum(['user', 'admin'], { message: 'Role must be user or admin' })
  role?: UserRole;

  @ApiPropertyOptional({ example: ['typescript', 'nest.js', 'mongodb'], description: 'Updated interests' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];
}
