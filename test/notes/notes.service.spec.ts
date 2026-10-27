import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { NotesService } from '../../src/notes/notes.service';

describe('NotesService Ownership Enforcement', () => {
  it('should throw 403 Forbidden when a user attempts to update a note owned by another user', async () => {
    const mockNotesRepo = {
      findById: jest.fn().mockResolvedValue({
        _id: 'note123',
        title: 'Original Title',
        owner: { toString: () => 'ownerUser456' },
      }),
    };
    const service = new NotesService(mockNotesRepo as any);

    await expect(
      service.updateNote('note123', 'differentUser789', { title: 'Hacked' })
    ).rejects.toThrow(ForbiddenException);
  });

  it('should throw 403 Forbidden when a user attempts to delete a note owned by another user', async () => {
    const mockNotesRepo = {
      findById: jest.fn().mockResolvedValue({
        _id: 'note123',
        title: 'Original Title',
        owner: { toString: () => 'ownerUser456' },
      }),
    };
    const service = new NotesService(mockNotesRepo as any);

    await expect(
      service.deleteNote('note123', 'differentUser789')
    ).rejects.toThrow(ForbiddenException);
  });
});
