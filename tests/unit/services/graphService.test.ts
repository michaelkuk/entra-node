/**
 * Unit tests for GraphService
 * Demonstrates mocking external dependencies and API calls
 */

import { GraphService, User } from '../../../src/services/graphService';
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredential } from '@azure/identity';

// Mock the Microsoft Graph Client
jest.mock('@microsoft/microsoft-graph-client');

describe('GraphService', () => {
  let graphService: GraphService;
  let mockCredential: TokenCredential;
  let mockClient: any;
  let mockApi: any;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Create mock credential
    mockCredential = {
      getToken: jest.fn().mockResolvedValue({
        token: 'mock-token',
        expiresOnTimestamp: Date.now() + 3600000,
      }),
    } as any;

    // Create chainable mock API
    mockApi = {
      get: jest.fn(),
      select: jest.fn().mockReturnThis(),
      filter: jest.fn().mockReturnThis(),
      top: jest.fn().mockReturnThis(),
      expand: jest.fn().mockReturnThis(),
    };

    // Create mock client
    mockClient = {
      api: jest.fn().mockReturnValue(mockApi),
    };

    // Mock the Client.initWithMiddleware to return our mock client
    (Client.initWithMiddleware as jest.Mock).mockReturnValue(mockClient);

    // Create service instance
    graphService = new GraphService(mockCredential);
  });

  describe('getUsers', () => {
    it('should fetch all users successfully', async () => {
      const mockUsers: User[] = [
        {
          id: '1',
          displayName: 'John Doe',
          userPrincipalName: 'john@example.com',
          mail: 'john@example.com',
          jobTitle: 'Engineer',
          department: 'IT',
        },
        {
          id: '2',
          displayName: 'Jane Smith',
          userPrincipalName: 'jane@example.com',
          mail: 'jane@example.com',
          jobTitle: 'Manager',
          department: 'Sales',
        },
      ];

      mockApi.get.mockResolvedValue({ value: mockUsers });

      const result = await graphService.getUsers();

      expect(result).toEqual(mockUsers);
      expect(mockClient.api).toHaveBeenCalledWith('/users');
      expect(mockApi.select).toHaveBeenCalledWith(
        'id,displayName,userPrincipalName,mail,jobTitle,department',
      );
      expect(mockApi.top).toHaveBeenCalledWith(999);
      expect(mockApi.get).toHaveBeenCalled();
    });

    it('should return empty array when no users found', async () => {
      mockApi.get.mockResolvedValue({ value: [] });

      const result = await graphService.getUsers();

      expect(result).toEqual([]);
    });

    it('should handle API response without value property', async () => {
      mockApi.get.mockResolvedValue({});

      const result = await graphService.getUsers();

      expect(result).toEqual([]);
    });

    it('should throw error when API call fails', async () => {
      mockApi.get.mockRejectedValue(new Error('API Error'));

      await expect(graphService.getUsers()).rejects.toThrow(
        'Failed to fetch users from Microsoft Graph',
      );
    });
  });

  describe('getUserById', () => {
    it('should fetch a single user by ID', async () => {
      const mockUser: User = {
        id: '123',
        displayName: 'John Doe',
        userPrincipalName: 'john@example.com',
        mail: 'john@example.com',
      };

      mockApi.get.mockResolvedValue(mockUser);

      const result = await graphService.getUserById('123');

      expect(result).toEqual(mockUser);
      expect(mockClient.api).toHaveBeenCalledWith('/users/123');
      expect(mockApi.select).toHaveBeenCalled();
    });

    it('should throw error when user not found', async () => {
      mockApi.get.mockRejectedValue(new Error('User not found'));

      await expect(graphService.getUserById('invalid-id')).rejects.toThrow(
        'Failed to fetch user invalid-id',
      );
    });
  });

  describe('getUserManager', () => {
    it('should fetch user manager successfully', async () => {
      const mockManager: User = {
        id: '999',
        displayName: 'Manager Name',
        userPrincipalName: 'manager@example.com',
        mail: 'manager@example.com',
      };

      mockApi.get.mockResolvedValue(mockManager);

      const result = await graphService.getUserManager('123');

      expect(result).toEqual(mockManager);
      expect(mockClient.api).toHaveBeenCalledWith('/users/123/manager');
    });

    it('should return null when manager does not exist', async () => {
      mockApi.get.mockRejectedValue(new Error('Manager not found'));

      const result = await graphService.getUserManager('123');

      expect(result).toBeNull();
    });

    it('should return null when API call fails', async () => {
      mockApi.get.mockRejectedValue(new Error('Network error'));

      const result = await graphService.getUserManager('123');

      expect(result).toBeNull();
    });
  });

  describe('getUserGroups', () => {
    it('should fetch user security groups', async () => {
      const mockGroups = {
        value: [
          { displayName: 'Security Group 1' },
          { displayName: 'Security Group 2' },
        ],
      };

      mockApi.get.mockResolvedValue(mockGroups);

      const result = await graphService.getUserGroups('123');

      expect(result).toEqual(['Security Group 1', 'Security Group 2']);
      expect(mockClient.api).toHaveBeenCalledWith('/users/123/memberOf');
      expect(mockApi.filter).toHaveBeenCalledWith('securityEnabled eq true');
      expect(mockApi.select).toHaveBeenCalledWith('displayName');
    });

    it('should return empty array when user has no groups', async () => {
      mockApi.get.mockResolvedValue({ value: [] });

      const result = await graphService.getUserGroups('123');

      expect(result).toEqual([]);
    });

    it('should handle groups without displayName', async () => {
      const mockGroups = {
        value: [
          { displayName: 'Group 1' },
          { id: 'group-2' }, // No displayName
          { displayName: '' }, // Empty displayName
        ],
      };

      mockApi.get.mockResolvedValue(mockGroups);

      const result = await graphService.getUserGroups('123');

      // Groups without displayName get empty string
      expect(result).toEqual(['Group 1', '', '']);
    });

    it('should return empty array when API call fails', async () => {
      mockApi.get.mockRejectedValue(new Error('API Error'));

      const result = await graphService.getUserGroups('123');

      expect(result).toEqual([]);
    });
  });
});
