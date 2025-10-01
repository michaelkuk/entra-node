/**
 * Unit tests for TenantService
 */

import { TenantService } from '../../../src/services/tenantService';
import { Client } from '@microsoft/microsoft-graph-client';

// Mock the Microsoft Graph Client
jest.mock('@microsoft/microsoft-graph-client');

describe('TenantService', () => {
  let tenantService: TenantService;
  let mockClient: any;
  let mockApi: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create chainable mock API
    mockApi = {
      get: jest.fn(),
      select: jest.fn().mockReturnThis(),
    };

    // Create mock client
    mockClient = {
      api: jest.fn().mockReturnValue(mockApi),
    };

    tenantService = new TenantService(mockClient);
  });

  describe('getAvailableTenants', () => {
    it('should fetch and return available tenants successfully', async () => {
      const mockOrganizationResponse = {
        value: [
          {
            id: 'tenant-1',
            displayName: 'Contoso Ltd',
            verifiedDomains: [
              { name: 'contoso.onmicrosoft.com', isDefault: true },
              { name: 'contoso.com', isDefault: false },
            ],
            tenantType: 'AAD',
          },
          {
            id: 'tenant-2',
            displayName: 'Fabrikam Inc',
            verifiedDomains: [
              { name: 'fabrikam.onmicrosoft.com', isDefault: true },
            ],
            tenantType: 'AAD',
          },
        ],
      };

      mockApi.get.mockResolvedValue(mockOrganizationResponse);

      const result = await tenantService.getAvailableTenants();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'tenant-1',
        displayName: 'Contoso Ltd',
        defaultDomain: 'contoso.onmicrosoft.com',
        tenantType: 'AAD',
      });
      expect(result[1]).toEqual({
        id: 'tenant-2',
        displayName: 'Fabrikam Inc',
        defaultDomain: 'fabrikam.onmicrosoft.com',
        tenantType: 'AAD',
      });

      expect(mockClient.api).toHaveBeenCalledWith('/organization');
      expect(mockApi.select).toHaveBeenCalledWith(
        'id,displayName,verifiedDomains,tenantType',
      );
    });

    it('should handle organization without default domain', async () => {
      const mockOrganizationResponse = {
        value: [
          {
            id: 'tenant-1',
            displayName: 'Test Org',
            verifiedDomains: [
              { name: 'test.onmicrosoft.com', isDefault: false },
              { name: 'test.com', isDefault: false },
            ],
          },
        ],
      };

      mockApi.get.mockResolvedValue(mockOrganizationResponse);

      const result = await tenantService.getAvailableTenants();

      expect(result).toHaveLength(1);
      expect(result[0].defaultDomain).toBe('test.onmicrosoft.com'); // Falls back to first domain
    });

    it('should handle organization without verified domains', async () => {
      const mockOrganizationResponse = {
        value: [
          {
            id: 'tenant-1',
            displayName: 'Test Org',
          },
        ],
      };

      mockApi.get.mockResolvedValue(mockOrganizationResponse);

      const result = await tenantService.getAvailableTenants();

      expect(result).toHaveLength(1);
      expect(result[0].defaultDomain).toBe('unknown');
    });

    it('should handle organization without display name', async () => {
      const mockOrganizationResponse = {
        value: [
          {
            id: 'tenant-1',
            verifiedDomains: [
              { name: 'test.onmicrosoft.com', isDefault: true },
            ],
          },
        ],
      };

      mockApi.get.mockResolvedValue(mockOrganizationResponse);

      const result = await tenantService.getAvailableTenants();

      expect(result).toHaveLength(1);
      expect(result[0].displayName).toBe('Unnamed Organization');
    });

    it('should return empty array when no organizations found', async () => {
      mockApi.get.mockResolvedValue({ value: [] });

      const result = await tenantService.getAvailableTenants();

      expect(result).toEqual([]);
    });

    it('should return empty array when response has no value property', async () => {
      mockApi.get.mockResolvedValue({});

      const result = await tenantService.getAvailableTenants();

      expect(result).toEqual([]);
    });

    it('should throw error when API call fails', async () => {
      mockApi.get.mockRejectedValue(new Error('API Error'));

      await expect(tenantService.getAvailableTenants()).rejects.toThrow(
        'Unable to fetch available tenants',
      );
    });
  });

  describe('getTenantById', () => {
    it('should fetch tenant by ID successfully', async () => {
      const mockOrganization = {
        id: 'tenant-1',
        displayName: 'Contoso Ltd',
        verifiedDomains: [
          { name: 'contoso.onmicrosoft.com', isDefault: true },
          { name: 'contoso.com', isDefault: false },
        ],
        tenantType: 'AAD',
      };

      mockApi.get.mockResolvedValue(mockOrganization);

      const result = await tenantService.getTenantById('tenant-1');

      expect(result).toEqual({
        id: 'tenant-1',
        displayName: 'Contoso Ltd',
        defaultDomain: 'contoso.onmicrosoft.com',
        tenantType: 'AAD',
      });

      expect(mockClient.api).toHaveBeenCalledWith('/organization/tenant-1');
      expect(mockApi.select).toHaveBeenCalledWith(
        'id,displayName,verifiedDomains,tenantType',
      );
    });

    it('should return null when tenant not found', async () => {
      mockApi.get.mockResolvedValue(null);

      const result = await tenantService.getTenantById('invalid-id');

      expect(result).toBeNull();
    });

    it('should return null when API call fails', async () => {
      mockApi.get.mockRejectedValue(new Error('Not found'));

      const result = await tenantService.getTenantById('invalid-id');

      expect(result).toBeNull();
    });

    it('should handle tenant without default domain', async () => {
      const mockOrganization = {
        id: 'tenant-1',
        displayName: 'Test Org',
        verifiedDomains: [{ name: 'test.com', isDefault: false }],
      };

      mockApi.get.mockResolvedValue(mockOrganization);

      const result = await tenantService.getTenantById('tenant-1');

      expect(result?.defaultDomain).toBe('test.com');
    });

    it('should handle tenant without verified domains', async () => {
      const mockOrganization = {
        id: 'tenant-1',
        displayName: 'Test Org',
      };

      mockApi.get.mockResolvedValue(mockOrganization);

      const result = await tenantService.getTenantById('tenant-1');

      expect(result?.defaultDomain).toBe('unknown');
    });
  });
});
