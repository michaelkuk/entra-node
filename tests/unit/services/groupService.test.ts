/**
 * Unit tests for group service
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { GroupService } from '../../../src/services/groupService';

const mockClient = {
  api: jest.fn(),
};

describe('GroupService', () => {
  let groupService: GroupService;
  const retryOptions = { maxRetries: 3, retryDelayMs: 100 };

  beforeEach(() => {
    jest.clearAllMocks();
    groupService = new GroupService(mockClient as any, retryOptions);
  });

  describe('getUserSecurityGroups', () => {
    it('should return security groups for user', async () => {
      const mockResponse = {
        value: [
          {
            '@odata.type': '#microsoft.graph.group',
            displayName: 'Security Group 1',
            securityEnabled: true,
          },
          {
            '@odata.type': '#microsoft.graph.group',
            displayName: 'Security Group 2',
            securityEnabled: true,
          },
        ],
      };

      mockClient.api.mockReturnValue({
        get: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await groupService.getUserSecurityGroups('user-123');

      expect(result).toEqual({
        groups: ['Security Group 1', 'Security Group 2'],
        count: 2,
      });
      expect(mockClient.api).toHaveBeenCalledWith('/users/user-123/memberOf');
    });

    it('should filter out non-security groups', async () => {
      const mockResponse = {
        value: [
          {
            '@odata.type': '#microsoft.graph.group',
            displayName: 'Security Group 1',
            securityEnabled: true,
          },
          {
            '@odata.type': '#microsoft.graph.group',
            displayName: 'Distribution List',
            securityEnabled: false,
          },
          {
            '@odata.type': '#microsoft.graph.administrativeUnit',
            displayName: 'Admin Unit',
            securityEnabled: true,
          },
        ],
      };

      mockClient.api.mockReturnValue({
        get: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await groupService.getUserSecurityGroups('user-123');

      expect(result).toEqual({
        groups: ['Security Group 1'],
        count: 1,
      });
    });

    it('should sort groups alphabetically', async () => {
      const mockResponse = {
        value: [
          {
            '@odata.type': '#microsoft.graph.group',
            displayName: 'Zebra Group',
            securityEnabled: true,
          },
          {
            '@odata.type': '#microsoft.graph.group',
            displayName: 'Alpha Group',
            securityEnabled: true,
          },
          {
            '@odata.type': '#microsoft.graph.group',
            displayName: 'Beta Group',
            securityEnabled: true,
          },
        ],
      };

      mockClient.api.mockReturnValue({
        get: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await groupService.getUserSecurityGroups('user-123');

      expect(result.groups).toEqual(['Alpha Group', 'Beta Group', 'Zebra Group']);
    });

    it('should return empty result when user has no groups', async () => {
      const mockResponse = {
        value: [],
      };

      mockClient.api.mockReturnValue({
        get: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await groupService.getUserSecurityGroups('user-123');

      expect(result).toEqual({
        groups: [],
        count: 0,
      });
    });

    it('should handle API errors gracefully', async () => {
      mockClient.api.mockReturnValue({
        get: jest.fn().mockRejectedValue(new Error('API Error')),
      });

      const result = await groupService.getUserSecurityGroups('user-123');

      expect(result).toEqual({
        groups: [],
        count: 0,
      });
    });
  });
});
