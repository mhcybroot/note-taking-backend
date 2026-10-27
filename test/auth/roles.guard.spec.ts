import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../../src/auth/guards/roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('should allow access if no roles are defined on handler/class', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);
    const mockContext = {
      getHandler: () => {},
      getClass: () => {},
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: 'user' } }),
      }),
    } as any;

    expect(guard.canActivate(mockContext)).toBe(true);
  });

  it('should allow access if user has required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
    const mockContext = {
      getHandler: () => {},
      getClass: () => {},
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: 'admin' } }),
      }),
    } as any;

    expect(guard.canActivate(mockContext)).toBe(true);
  });

  it('should deny access if user does not have required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
    const mockContext = {
      getHandler: () => {},
      getClass: () => {},
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: 'user' } }),
      }),
    } as any;

    expect(guard.canActivate(mockContext)).toBe(false);
  });
});
