import { UserSchema } from '../../src/users/schemas/user.schema';

describe('UserSchema Indexing Strategy', () => {
  it('should define exactly the required indexes with schema.index()', () => {
    const indexes = UserSchema.indexes();
    const indexFields = indexes.map(([spec]) => spec);

    // Verify email unique index
    expect(indexFields).toContainEqual({ email: 1 });
    // Verify createdAt chronological sort index
    expect(indexFields).toContainEqual({ createdAt: -1 });
    // Verify interests multikey index
    expect(indexFields).toContainEqual({ interests: 1 });
    // Ensure no redundant compound or unnecessary indexes exist
    expect(indexes.length).toBe(3);
  });
});
