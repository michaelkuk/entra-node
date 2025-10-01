/**
 * Unit tests for user service
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { UserService } from '../../../src/services/userService';

const mockClient = {
  api: jest.fn(),
};

describe('UserService', () => {
  let userService: UserService;
  const retryOptions = { maxRetries: 3, retryDelayMs: 100 };

  beforeEach(() => {
    jest.clearAllMocks();
    userService = new UserService(mockClient as any, retryOptions);
  });

  describe('getAllUsers', () => {
    it('should fetch all users with premium subscription', async () => {
      const mockUsers = {
        value: [
          {
            id: '1',
            displayName: 'User 1',
            userPrincipalName: 'user1@example.com',
          },
          {
            id: '2',
            displayName: 'User 2',
            userPrincipalName: 'user2@example.com',
          },
        ],
      };

      mockClient.api.mockReturnValue({
        get: jest.fn().mockResolvedValue(mockUsers),
      });

      const result = await userService.getAllUsers(true);

      expect(result).toHaveLength(2);
      expect(result[0].displayName).toBe('User 1');
      expect(mockClient.api).toHaveBeenCalledWith(
        expect.stringContaining('signInActivity'),
      );
    });

    it('should fetch all users without premium subscription', async () => {
      const mockUsers = {
        value: [
          {
            id: '1',
            displayName: 'User 1',
            userPrincipalName: 'user1@example.com',
          },
        ],
      };

      mockClient.api.mockReturnValue({
        get: jest.fn().mockResolvedValue(mockUsers),
      });

      const result = await userService.getAllUsers(false);

      expect(result).toHaveLength(1);
      expect(mockClient.api).toHaveBeenCalledWith(
        expect.not.stringContaining('signInActivity'),
      );
    });

    it('should handle pagination', async () => {
      const firstResponse = {
        value: [{ id: '1', displayName: 'User 1' }],
        '@odata.nextLink': 'https://graph.microsoft.com/v1.0/users?$skip=1',
      };

      const secondResponse = {
        value: [{ id: '2', displayName: 'User 2' }],
      };

      mockClient.api
        .mockReturnValueOnce({
          get: jest.fn().mockResolvedValue(firstResponse),
        })
        .mockReturnValueOnce({
          get: jest.fn().mockResolvedValue(secondResponse),
        });

      const result = await userService.getAllUsers(false);

      expect(result).toHaveLength(2);
      expect(mockClient.api).toHaveBeenCalledTimes(2);
    });

    it('should throw error on API failure', async () => {
      mockClient.api.mockReturnValue({
        get: jest.fn().mockRejectedValue(new Error('API Error')),
      });

      await expect(userService.getAllUsers(false)).rejects.toThrow();
    });

    it('should request correct properties', async () => {
      const mockUsers = {
        value: [],
      };

      mockClient.api.mockReturnValue({
        get: jest.fn().mockResolvedValue(mockUsers),
      });

      await userService.getAllUsers(true);

      const apiCall = mockClient.api.mock.calls[0][0];
      expect(apiCall).toContain('$select=');
      expect(apiCall).toContain('displayName');
      expect(apiCall).toContain('userPrincipalName');
      expect(apiCall).toContain('assignedLicenses');
      expect(apiCall).toContain('$expand=manager');
    });

    it('should return empty array when no users found', async () => {
      const mockUsers = {
        value: [],
      };

      mockClient.api.mockReturnValue({
        get: jest.fn().mockResolvedValue(mockUsers),
      });

      const result = await userService.getAllUsers(false);

      expect(result).toEqual([]);
    });
  });
});
