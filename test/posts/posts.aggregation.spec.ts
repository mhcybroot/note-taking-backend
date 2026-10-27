import { Types } from 'mongoose';
import { PostsRepository } from '../../src/posts/repositories/posts.repository';

describe('PostsRepository - Scenario 2 Aggregation', () => {
  it('should execute a single aggregation pipeline using $lookup stage', async () => {
    const mockExec = jest.fn().mockResolvedValue([
      {
        _id: 'post1',
        title: 'First Post',
        author: { _id: 'user1', name: 'John Doe', email: 'john@test.com' },
      },
    ]);
    const mockAggregate = jest.fn().mockReturnValue({ exec: mockExec });
    const mockPostModel = { aggregate: mockAggregate };
    const repo = new PostsRepository(mockPostModel as any);

    const targetUserId = new Types.ObjectId().toString();
    const result = await repo.findByUserWithLookup(targetUserId);

    expect(mockAggregate).toHaveBeenCalledTimes(1);
    const pipeline = mockAggregate.mock.calls[0][0];
    expect(pipeline[0]).toHaveProperty('$match');
    expect(pipeline[1]).toHaveProperty('$sort');
    expect(pipeline[2]).toHaveProperty('$lookup');
    expect(pipeline[2].$lookup).toEqual(
      expect.objectContaining({
        from: 'users',
        localField: 'author',
        foreignField: '_id',
        as: 'author',
      })
    );
    expect(result).toHaveLength(1);
  });
});
