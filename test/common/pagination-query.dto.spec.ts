import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PaginationQueryDto } from '../../src/common/dto/pagination-query.dto';

describe('PaginationQueryDto', () => {
  it('should accept valid sortBy=createdAt and valid page/limit', async () => {
    const dto = plainToInstance(PaginationQueryDto, {
      page: '2',
      limit: '15',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.page).toBe(2);
    expect(dto.limit).toBe(15);
    expect(dto.skip).toBe(15);
  });

  it('should reject unindexed sortBy fields (e.g. sortBy=unindexedField)', async () => {
    const dto = plainToInstance(PaginationQueryDto, {
      page: 1,
      limit: 10,
      sortBy: 'unindexedField',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('sortBy');
  });
});
