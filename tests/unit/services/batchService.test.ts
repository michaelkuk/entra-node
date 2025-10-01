/**
 * Unit tests for batch service
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { BatchService } from '../../../src/services/batchService';

const mockClient = {
  api: jest.fn(),
};

describe('BatchService', () => {
  let batchService: BatchService;
  const retryOptions = { maxRetries: 3, retryDelayMs: 100 };

  beforeEach(() => {
    jest.clearAllMocks();
    batchService = new BatchService(mockClient as any, retryOptions);
  });

  describe('createBatchRequest', () => {
    it('should create batch request with single URL', () => {
      const urls = ['/users/123/authentication/methods'];
      const batchRequest = batchService.createBatchRequest(urls);

      expect(batchRequest.requests).toHaveLength(1);
      expect(batchRequest.requests[0]).toEqual({
        id: '1',
        method: 'GET',
        url: '/users/123/authentication/methods',
      });
    });

    it('should create batch request with multiple URLs', () => {
      const urls = [
        '/users/123/authentication/methods',
        '/users/123/authentication/signInPreferences',
        '/users/123/memberOf',
      ];
      const batchRequest = batchService.createBatchRequest(urls);

      expect(batchRequest.requests).toHaveLength(3);
      expect(batchRequest.requests[0].id).toBe('1');
      expect(batchRequest.requests[1].id).toBe('2');
      expect(batchRequest.requests[2].id).toBe('3');
    });

    it('should set method to GET for all requests', () => {
      const urls = ['/users/123', '/groups/456'];
      const batchRequest = batchService.createBatchRequest(urls);

      expect(batchRequest.requests.every((r) => r.method === 'GET')).toBe(true);
    });

    it('should handle empty URL array', () => {
      const urls: string[] = [];
      const batchRequest = batchService.createBatchRequest(urls);

      expect(batchRequest.requests).toHaveLength(0);
    });
  });

  describe('executeBatch', () => {
    it('should execute batch request successfully', async () => {
      const mockResponse = {
        responses: [
          {
            id: '1',
            status: 200,
            body: { value: [] },
          },
        ],
      };

      mockClient.api.mockReturnValue({
        post: jest.fn().mockResolvedValue(mockResponse),
      });

      const batchRequest = batchService.createBatchRequest(['/users/123']);
      const result = await batchService.executeBatch(batchRequest);

      expect(mockClient.api).toHaveBeenCalledWith('/$batch');
      expect(result).toEqual(mockResponse);
    });

    it('should return empty responses on error', async () => {
      mockClient.api.mockReturnValue({
        post: jest.fn().mockRejectedValue(new Error('API Error')),
      });

      const batchRequest = batchService.createBatchRequest(['/users/123']);
      const result = await batchService.executeBatch(batchRequest);

      expect(result).toEqual({ responses: [] });
    });

    it('should handle batch with multiple responses', async () => {
      const mockResponse = {
        responses: [
          { id: '1', status: 200, body: { value: ['method1'] } },
          { id: '2', status: 200, body: { preference: 'sms' } },
          { id: '3', status: 404, body: { error: 'Not found' } },
        ],
      };

      mockClient.api.mockReturnValue({
        post: jest.fn().mockResolvedValue(mockResponse),
      });

      const batchRequest = batchService.createBatchRequest([
        '/users/123/methods',
        '/users/123/preferences',
        '/users/999/invalid',
      ]);
      const result = await batchService.executeBatch(batchRequest);

      expect(result.responses).toHaveLength(3);
      expect(result.responses[2].status).toBe(404);
    });
  });
});
