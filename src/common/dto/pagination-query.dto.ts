import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginationQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1, description: 'Page number' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10, description: 'Number of items per page' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;

  @ApiPropertyOptional({ example: 'createdAt', default: 'createdAt', description: 'Indexed sort field' })
  @IsOptional()
  @IsIn(['createdAt'], { message: 'sortBy must be an indexed field (createdAt)' })
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc', description: 'Sort direction' })
  @IsOptional()
  @IsIn(['asc', 'desc', '1', '-1'])
  sortOrder?: 'asc' | 'desc' | '1' | '-1' = 'desc';

  get skip(): number {
    return (this.page - 1) * this.limit;
  }
}
