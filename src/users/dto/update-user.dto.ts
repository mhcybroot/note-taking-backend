import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'My New Name', description: 'Updated display name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: ['privacy', 'encryption', 'vaults'], description: 'Updated interests list' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];
}
