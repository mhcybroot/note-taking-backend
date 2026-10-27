import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@notetaking.local', description: 'Registered email address' })
  @IsEmail({}, { message: 'A valid email address is required' })
  email: string;

  @ApiProperty({ example: 'AdminSecurePassword123!', description: 'Account password' })
  @IsString()
  @MinLength(1, { message: 'Password is required' })
  password: string;
}
