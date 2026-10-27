import { NoteSchema } from '../../src/notes/schemas/note.schema';

describe('NoteSchema Indexing Strategy', () => {
  it('should define exactly the required indexes with schema.index()', () => {
    const indexes = NoteSchema.indexes();
    const indexFields = indexes.map(([spec]) => spec);

    // Verify compound index for user listing own notes: { owner: 1, createdAt: -1 }
    expect(indexFields).toContainEqual({ owner: 1, createdAt: -1 });

    // Verify chronological sort index for admin listing all notes: { createdAt: -1 }
    expect(indexFields).toContainEqual({ createdAt: -1 });

    // Verify no redundant indexes exist
    expect(indexes.length).toBe(2);
  });
});
