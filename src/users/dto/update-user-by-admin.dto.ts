import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole } from '../schemas/user.schema';

export class UpdateUserByAdminDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(['user', 'admin'], { message: 'Role must be user or admin' })
  role?: UserRole;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];
}
