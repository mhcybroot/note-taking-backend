import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class NoteQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: '671e621f8a84c207fae4bc81', description: 'Filter by note owner user ID (Admin only)' })
  @IsOptional()
  @IsMongoId({ message: 'owner must be a valid MongoDB ObjectId' })
  owner?: string;
}
