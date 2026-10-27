import { HttpException, HttpStatus } from '@nestjs/common';
import { AllExceptionsFilter } from '../../src/common/filters/all-exceptions.filter';

describe('AllExceptionsFilter', () => {
  it('should format HttpExceptions into standardized JSON response', () => {
    const filter = new AllExceptionsFilter();
    const mockJson = jest.fn();
    const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    const mockHost = {
      switchToHttp: () => ({
        getResponse: () => ({ status: mockStatus }),
        getRequest: () => ({ url: '/test' }),
      }),
    } as any;

    filter.catch(new HttpException('Forbidden', HttpStatus.FORBIDDEN), mockHost);
    expect(mockStatus).toHaveBeenCalledWith(403);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 403,
        message: 'Forbidden',
      })
    );
  });

  it('should return generic Internal server error in production when unhandled Error occurs', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const filter = new AllExceptionsFilter();
    const mockJson = jest.fn();
    const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    const mockHost = {
      switchToHttp: () => ({
        getResponse: () => ({ status: mockStatus }),
        getRequest: () => ({ url: '/test' }),
      }),
    } as any;

    filter.catch(new Error('Sensitive Mongo topology details: cluster.internal:27017'), mockHost);
    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        message: 'Internal server error',
      })
    );

    process.env.NODE_ENV = originalEnv;
  });
});
