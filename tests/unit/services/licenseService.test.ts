/**
 * Unit tests for license service
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { LicenseService } from '../../../src/services/licenseService';
import { AssignedLicense } from '../../../src/types';

// Mock the SkuMappingService module
jest.mock('../../../src/services/skuMappingService', () => ({
  SkuMappingService: class MockSkuMappingService {
    async buildSkuFriendlyNameMap(): Promise<void> {
      return Promise.resolve();
    }

    getFriendlyNameByStringId(stringId: string): string | undefined {
      // Mock mappings for common SKUs used in tests
      const mappings: Record<string, string> = {
        ENTERPRISEPACK: 'Office 365 E3',
        SPE_E5: 'Microsoft 365 E5',
        ZEBRA_LICENSE: 'Zebra License',
        ALPHA_LICENSE: 'Alpha License',
      };
      return mappings[stringId];
    }

    getFriendlyNameByGuid(_guid: string): string | undefined {
      return undefined;
    }
  },
}));

// Mock the Client
const mockClient = {
  api: jest.fn(),
};

describe('LicenseService', () => {
  let licenseService: LicenseService;
  const retryOptions = { maxRetries: 3, retryDelayMs: 100 };

  beforeEach(() => {
    jest.clearAllMocks();
    licenseService = new LicenseService(mockClient as any, retryOptions);
  });

  describe('buildLicenseSkuMap', () => {
    it('should build license SKU map from API response', async () => {
      const mockSkus = {
        value: [
          {
            skuId: 'sku-1',
            skuPartNumber: 'ENTERPRISEPACK',
            servicePlans: [
              { servicePlanId: 'plan-1', servicePlanName: 'EXCHANGE_S_ENTERPRISE', provisioningStatus: 'Success' },
            ],
          },
          {
            skuId: 'sku-2',
            skuPartNumber: 'SPE_E5',
            servicePlans: [
              { servicePlanId: 'plan-2', servicePlanName: 'SHAREPOINTENTERPRISE', provisioningStatus: 'Success' },
            ],
          },
        ],
      };

      mockClient.api.mockReturnValue({
        get: jest.fn().mockResolvedValue(mockSkus),
      });

      await licenseService.buildLicenseSkuMap();

      expect(mockClient.api).toHaveBeenCalledWith('/subscribedSkus');
    });

    it('should handle API errors gracefully', async () => {
      mockClient.api.mockReturnValue({
        get: jest.fn().mockRejectedValue(new Error('API Error')),
      });

      await expect(licenseService.buildLicenseSkuMap()).resolves.toBeUndefined();
    });
  });

  describe('checkPremiumSubscription', () => {
    it('should return true when Premium subscription exists', async () => {
      const mockSkus = {
        value: [
          {
            servicePlans: [{ servicePlanName: 'AAD_PREMIUM' }],
          },
        ],
      };

      mockClient.api.mockReturnValue({
        get: jest.fn().mockResolvedValue(mockSkus),
      });

      const result = await licenseService.checkPremiumSubscription();
      expect(result).toBe(true);
    });

    it('should return false when Premium subscription does not exist', async () => {
      const mockSkus = {
        value: [
          {
            servicePlans: [{ servicePlanName: 'SOME_OTHER_PLAN' }],
          },
        ],
      };

      mockClient.api.mockReturnValue({
        get: jest.fn().mockResolvedValue(mockSkus),
      });

      const result = await licenseService.checkPremiumSubscription();
      expect(result).toBe(false);
    });

    it('should return false on API error', async () => {
      mockClient.api.mockReturnValue({
        get: jest.fn().mockRejectedValue(new Error('API Error')),
      });

      const result = await licenseService.checkPremiumSubscription();
      expect(result).toBe(false);
    });
  });

  describe('getUserLicenseDetails', () => {
    beforeEach(async () => {
      // Setup license SKU map
      const mockSkus = {
        value: [
          {
            skuId: 'sku-1',
            skuPartNumber: 'ENTERPRISEPACK',
            servicePlans: [
              { servicePlanId: 'plan-1', servicePlanName: 'EXCHANGE_S_ENTERPRISE', provisioningStatus: 'Success' },
              { servicePlanId: 'plan-2', servicePlanName: 'SHAREPOINTENTERPRISE', provisioningStatus: 'Success' },
              { servicePlanId: 'plan-3', servicePlanName: 'DISABLED_PLAN', provisioningStatus: 'Disabled' },
            ],
          },
        ],
      };

      mockClient.api.mockReturnValue({
        get: jest.fn().mockResolvedValue(mockSkus),
      });

      await licenseService.buildLicenseSkuMap();
    });

    it('should return empty details for no licenses', () => {
      const result = licenseService.getUserLicenseDetails(undefined);
      expect(result).toEqual({
        licenseSkus: [],
        licenseCount: 0,
        servicePlans: [],
      });
    });

    it('should return empty details for empty license array', () => {
      const result = licenseService.getUserLicenseDetails([]);
      expect(result).toEqual({
        licenseSkus: [],
        licenseCount: 0,
        servicePlans: [],
      });
    });

    it('should return license details with enabled service plans', () => {
      const assignedLicenses: AssignedLicense[] = [
        {
          skuId: 'sku-1',
          disabledPlans: [],
        },
      ];

      const result = licenseService.getUserLicenseDetails(assignedLicenses);
      expect(result.licenseSkus).toEqual(['Office 365 E3']); // Now returns friendly name
      expect(result.licenseCount).toBe(1);
      expect(result.servicePlans).toEqual(['EXCHANGE_S_ENTERPRISE', 'SHAREPOINTENTERPRISE']);
    });

    it('should exclude disabled service plans', () => {
      const assignedLicenses: AssignedLicense[] = [
        {
          skuId: 'sku-1',
          disabledPlans: ['plan-2'], // Disable SHAREPOINTENTERPRISE
        },
      ];

      const result = licenseService.getUserLicenseDetails(assignedLicenses);
      expect(result.servicePlans).toEqual(['EXCHANGE_S_ENTERPRISE']);
    });

    it('should handle unknown SKU IDs', () => {
      const assignedLicenses: AssignedLicense[] = [
        {
          skuId: 'unknown-sku',
          disabledPlans: [],
        },
      ];

      const result = licenseService.getUserLicenseDetails(assignedLicenses);
      expect(result.licenseSkus).toEqual(['unknown-sku']);
      expect(result.servicePlans).toEqual([]);
    });

    it('should sort license SKUs and service plans', async () => {
      const mockSkusMultiple = {
        value: [
          {
            skuId: 'sku-1',
            skuPartNumber: 'ZEBRA_LICENSE',
            servicePlans: [
              { servicePlanId: 'plan-z', servicePlanName: 'Z_PLAN', provisioningStatus: 'Success' },
            ],
          },
          {
            skuId: 'sku-2',
            skuPartNumber: 'ALPHA_LICENSE',
            servicePlans: [
              { servicePlanId: 'plan-a', servicePlanName: 'A_PLAN', provisioningStatus: 'Success' },
            ],
          },
        ],
      };

      mockClient.api.mockReturnValue({
        get: jest.fn().mockResolvedValue(mockSkusMultiple),
      });

      // Rebuild map with new data
      const newService = new LicenseService(mockClient as any, retryOptions);
      await newService.buildLicenseSkuMap();

      const assignedLicenses: AssignedLicense[] = [
        { skuId: 'sku-1', disabledPlans: [] },
        { skuId: 'sku-2', disabledPlans: [] },
      ];

      const result = newService.getUserLicenseDetails(assignedLicenses);
      // Should be sorted: Alpha License comes before Zebra License
      expect(result.licenseSkus).toEqual(['Alpha License', 'Zebra License']);
    });
  });
});
