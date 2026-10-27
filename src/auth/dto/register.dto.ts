import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email address' })
  @IsEmail({}, { message: 'A valid email address is required' })
  email: string;

  @ApiProperty({ example: 'Password123!', description: 'Password (min 6 characters)' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @ApiProperty({ example: 'Alice Developer', description: 'Full name' })
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @ApiPropertyOptional({ example: ['chess', 'reading'], description: 'List of personal interests' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];
}
