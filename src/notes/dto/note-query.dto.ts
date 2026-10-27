import { IsMongoId, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class NoteQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsMongoId({ message: 'owner must be a valid MongoDB ObjectId' })
  owner?: string;
}
