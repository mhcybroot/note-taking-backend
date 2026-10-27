import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { NoteQueryDto } from '../../src/notes/dto/note-query.dto';

describe('NoteQueryDto', () => {
  it('should accept valid 24-character hexadecimal MongoDB ObjectId as owner', async () => {
    const dto = plainToInstance(NoteQueryDto, {
      owner: '507f1f77bcf86cd799439011',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should reject invalid non-ObjectId string as owner', async () => {
    const dto = plainToInstance(NoteQueryDto, {
      owner: 'invalid-non-object-id',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('owner');
  });
});
