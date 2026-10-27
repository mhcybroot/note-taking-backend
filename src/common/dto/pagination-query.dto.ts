import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;

  @IsOptional()
  @IsIn(['createdAt'], { message: 'sortBy must be an indexed field (createdAt)' })
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc', '1', '-1'])
  sortOrder?: 'asc' | 'desc' | '1' | '-1' = 'desc';

  get skip(): number {
    return (this.page - 1) * this.limit;
  }
}
