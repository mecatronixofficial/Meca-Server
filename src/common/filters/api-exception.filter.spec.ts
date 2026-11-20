import { ArgumentsHost, BadRequestException, Logger } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { ApiExceptionFilter } from './api-exception.filter';

describe('ApiExceptionFilter', () => {
  const filter = new ApiExceptionFilter();
  let logError: jest.SpyInstance;

  beforeEach(() => {
    logError = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  function catchError(exception: unknown) {
    const response = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const host = {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => ({ method: 'GET', url: '/mec-api/project/all' }),
      }),
    } as unknown as ArgumentsHost;
    filter.catch(exception, host);
    return response;
  }

  it('logs the error message even when the stack is missing', () => {
    const error = new Error('Something unexpected');
    error.stack = undefined;

    const response = catchError(error);

    expect(logError).toHaveBeenCalledWith('GET /mec-api/project/all: Something unexpected', undefined);
    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: 'Internal server error' }));
  });

  it('answers 503 with a retry message when the database connection drops', () => {
    const error = new Error('Connection terminated unexpectedly');

    const response = catchError(error);

    expect(logError).toHaveBeenCalledWith('GET /mec-api/project/all: Connection terminated unexpectedly', error.stack);
    expect(response.status).toHaveBeenCalledWith(503);
    expect(response.json.mock.calls[0][0].message).toMatch(/try again/i);
  });

  it('logs database diagnostics while keeping them out of the client response', () => {
    const driverError = Object.assign(new Error('connection failure'), { code: '08006' });
    const error = new QueryFailedError('SELECT * FROM projects', [], driverError);

    const response = catchError(error);

    expect(logError).toHaveBeenCalledWith('GET /mec-api/project/all: connection failure [08006]', error.stack);
    expect(response.status).toHaveBeenCalledWith(503);
    const body = response.json.mock.calls[0][0];
    expect(body.message).toMatch(/try again/i);
    expect(JSON.stringify(body)).not.toContain('connection failure');
    expect(JSON.stringify(body)).not.toContain('SELECT');
  });

  it('treats a full connection pool as temporarily unavailable', () => {
    const driverError = Object.assign(new Error('sorry, too many clients already'), { code: '53300' });

    const response = catchError(new QueryFailedError('SELECT count(*) FROM enquiries', [], driverError));

    expect(response.status).toHaveBeenCalledWith(503);
  });

  it('asks for migrations when a table or column is missing, without naming it', () => {
    const driverError = Object.assign(new Error('relation "site_previews" does not exist'), { code: '42P01' });

    const response = catchError(new QueryFailedError('SELECT * FROM site_previews', [], driverError));

    expect(response.status).toHaveBeenCalledWith(500);
    const body = response.json.mock.calls[0][0];
    expect(body.message).toMatch(/migrations/);
    expect(JSON.stringify(body)).not.toContain('site_previews');
  });

  it('includes messages and codes from thrown objects', () => {
    catchError({ message: 'Connection timed out', code: 'ETIMEDOUT' });

    expect(logError).toHaveBeenCalledWith('GET /mec-api/project/all: Connection timed out [ETIMEDOUT]', undefined);
  });

  it('preserves known database conflict responses without logging server errors', () => {
    const error = new QueryFailedError('INSERT INTO projects', [], Object.assign(new Error('duplicate key'), { code: '23505' }));

    const response = catchError(error);

    expect(response.status).toHaveBeenCalledWith(409);
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'A record with the same unique value already exists' }));
    expect(logError).not.toHaveBeenCalled();
  });

  it('preserves validation errors without logging server errors', () => {
    const response = catchError(new BadRequestException(['Invalid value']));

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Invalid value', errors: ['Invalid value'] }));
    expect(logError).not.toHaveBeenCalled();
  });
});
