/**
 * Mock for Microsoft Graph Client
 * This mock allows testing without making real API calls
 */

export class Client {
  static init = jest.fn(() => new Client());
  static initWithMiddleware = jest.fn(() => new Client());

  api = jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    put: jest.fn(),
    select: jest.fn().mockReturnThis(),
    expand: jest.fn().mockReturnThis(),
    filter: jest.fn().mockReturnThis(),
    top: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    orderby: jest.fn().mockReturnThis(),
    count: jest.fn().mockReturnThis(),
    header: jest.fn().mockReturnThis(),
    version: jest.fn().mockReturnThis(),
  }));
}

export const mockGraphClient = {
  Client,
};
