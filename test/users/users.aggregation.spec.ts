import { UsersRepository } from '../../src/users/repositories/users.repository';

describe('UsersRepository - Scenario 1 Aggregation', () => {
  it('should call aggregate exactly once with the match, unwind, group, sort, project pipeline', async () => {
    const mockExec = jest.fn().mockResolvedValue([
      { interest: 'chess', count: 2, users: [{ id: '1', name: 'Alice' }] },
    ]);
    const mockAggregate = jest.fn().mockReturnValue({ exec: mockExec });
    const mockUserModel = { aggregate: mockAggregate };
    const repo = new UsersRepository(mockUserModel as any);

    const result = await repo.groupByInterests();

    expect(mockAggregate).toHaveBeenCalledTimes(1);
    const pipeline = mockAggregate.mock.calls[0][0];
    // Must match directly on interests to leverage multikey index (IXSCAN)
    expect(pipeline[0]).toEqual({ $match: { interests: { $exists: true, $ne: [] } } });
    expect(pipeline[1]).toEqual({ $unwind: '$interests' });
    expect(pipeline[2]).toHaveProperty('$group');
    expect(pipeline[2].$group.users).toHaveProperty('$addToSet');
    expect(pipeline[3]).toHaveProperty('$sort');
    expect(pipeline[4]).toHaveProperty('$project');
    expect(result).toHaveLength(1);
  });
});
