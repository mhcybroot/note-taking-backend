import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '../schemas/user.schema';

export class CreateUserDto {
  @ApiProperty({ example: 'newuser@notetaking.local', description: 'User email address' })
  @IsEmail({}, { message: 'A valid email address is required' })
  email: string;

  @ApiProperty({ example: 'SecurePassword123!', description: 'User password (min 6 characters)' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @ApiProperty({ example: 'Jane Doe', description: 'Full name' })
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @ApiPropertyOptional({ enum: ['user', 'admin'], default: 'user', description: 'Role' })
  @IsOptional()
  @IsEnum(['user', 'admin'], { message: 'Role must be user or admin' })
  role?: UserRole;

  @ApiPropertyOptional({ example: ['reading', 'coding'], description: 'List of interests' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];
}
