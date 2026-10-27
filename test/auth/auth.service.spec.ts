import { AuthService } from '../../src/auth/auth.service';

describe('AuthService Registration', () => {
  it('should ignore or forbid role in register payload and default role to user', async () => {
    const mockUsersRepo = {
      findByEmail: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((data) => Promise.resolve({ ...data, _id: 'mockId' })),
    };
    const mockJwtService = { sign: jest.fn().mockReturnValue('mockToken') };
    const authService = new AuthService(mockUsersRepo as any, mockJwtService as any);

    const payload: any = {
      email: 'attacker@test.com',
      password: 'password123',
      name: 'Attacker',
      role: 'admin', // Malicious attempt to self-promote
    };

    await authService.register(payload);
    expect(mockUsersRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'attacker@test.com',
        role: 'user', // MUST be 'user'
      })
    );
  });
});
