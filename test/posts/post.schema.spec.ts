import { PostSchema } from '../../src/posts/schemas/post.schema';

describe('PostSchema Indexing Strategy', () => {
  it('should define exactly the required indexes with schema.index()', () => {
    const indexes = PostSchema.indexes();
    const indexFields = indexes.map(([spec]) => spec);

    // Verify compound index for retrieving a user's posts chronologically: { author: 1, createdAt: -1 }
    expect(indexFields).toContainEqual({ author: 1, createdAt: -1 });

    // Verify chronological sort index for public feed: { createdAt: -1 }
    expect(indexFields).toContainEqual({ createdAt: -1 });

    // Ensure no redundant indexes exist
    expect(indexes.length).toBe(2);
  });
});
