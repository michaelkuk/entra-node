/**
 * Unit tests for retry utility
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { retryWithBackoff } from '../../../src/utils/retry';

describe('Retry Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('retryWithBackoff', () => {
    it('should return result on first attempt if successful', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      const result = await retryWithBackoff(mockFn, {
        maxRetries: 3,
        retryDelayMs: 100,
      });

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on throttling error (429)', async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce({ statusCode: 429, message: 'Too Many Requests' })
        .mockResolvedValue('success');

      const result = await retryWithBackoff(mockFn, {
        maxRetries: 3,
        retryDelayMs: 10,
      });

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should retry on throttled error message', async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce({ message: 'Request was throttled' })
        .mockResolvedValue('success');

      const result = await retryWithBackoff(mockFn, {
        maxRetries: 3,
        retryDelayMs: 10,
      });

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should use exponential backoff delay', async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce({ statusCode: 429 })
        .mockRejectedValueOnce({ statusCode: 429 })
        .mockResolvedValue('success');

      const startTime = Date.now();
      await retryWithBackoff(mockFn, {
        maxRetries: 3,
        retryDelayMs: 50,
      });
      const elapsed = Date.now() - startTime;

      // First retry: 50ms, second retry: 100ms = ~150ms total
      expect(elapsed).toBeGreaterThanOrEqual(100);
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should throw error after max retries exhausted', async () => {
      const mockFn = jest.fn().mockRejectedValue({ statusCode: 429, message: 'Throttled' });

      await expect(
        retryWithBackoff(mockFn, {
          maxRetries: 2,
          retryDelayMs: 10,
        }),
      ).rejects.toEqual({ statusCode: 429, message: 'Throttled' });

      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should not retry on non-throttling errors', async () => {
      const mockFn = jest.fn().mockRejectedValue({ statusCode: 404, message: 'Not Found' });

      await expect(
        retryWithBackoff(mockFn, {
          maxRetries: 3,
          retryDelayMs: 10,
        }),
      ).rejects.toEqual({ statusCode: 404, message: 'Not Found' });

      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should handle mixed error types', async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce({ statusCode: 429 })
        .mockRejectedValueOnce({ message: 'throttled' })
        .mockRejectedValueOnce({ message: 'Too Many Requests' })
        .mockResolvedValue('success');

      const result = await retryWithBackoff(mockFn, {
        maxRetries: 5,
        retryDelayMs: 10,
      });

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(4);
    });

    it('should respect maxRetries limit', async () => {
      const mockFn = jest.fn().mockRejectedValue({ statusCode: 429 });

      await expect(
        retryWithBackoff(mockFn, {
          maxRetries: 1,
          retryDelayMs: 10,
        }),
      ).rejects.toBeDefined();

      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });
});
