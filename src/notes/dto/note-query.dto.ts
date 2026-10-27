import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class NoteQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  owner?: string;
}
