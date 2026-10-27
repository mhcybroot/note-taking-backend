import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateNoteDto {
  @ApiPropertyOptional({ example: 'Updated Note Title', description: 'New title' })
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Title cannot exceed 200 characters' })
  title?: string;

  @ApiPropertyOptional({ example: 'Updated confidential content.', description: 'New content' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ example: false, description: 'Archive status' })
  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;
}
