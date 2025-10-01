/**
 * Unit tests for tenantSelector utility
 */

import { selectTenant } from '../../../src/utils/tenantSelector';
import { TenantInfo } from '../../../src/services/tenantService';
import prompts from 'prompts';

// Mock prompts
jest.mock('prompts');

describe('tenantSelector', () => {
  const mockTenants: TenantInfo[] = [
    {
      id: 'tenant-1',
      displayName: 'Contoso Ltd',
      defaultDomain: 'contoso.onmicrosoft.com',
      tenantType: 'AAD',
    },
    {
      id: 'tenant-2',
      displayName: 'Fabrikam Inc',
      defaultDomain: 'fabrikam.onmicrosoft.com',
      tenantType: 'AAD',
    },
    {
      id: 'tenant-3',
      displayName: 'Adventure Works',
      defaultDomain: 'adventureworks.onmicrosoft.com',
      tenantType: 'AAD',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Spy on console methods to suppress output during tests
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    // Restore console methods
    (console.log as jest.Mock).mockRestore();
    (console.error as jest.Mock).mockRestore();
  });

  describe('selectTenant', () => {
    it('should return null when no tenants are available', async () => {
      const result = await selectTenant([]);

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        '❌ No tenants available for selection.',
      );
    });

    it('should auto-select when only one tenant is available', async () => {
      const singleTenant = [mockTenants[0]];

      const result = await selectTenant(singleTenant);

      expect(result).toBe('tenant-1');
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Auto-selecting only available tenant'),
      );
      expect(prompts).not.toHaveBeenCalled();
    });

    it('should prompt user to select from multiple tenants', async () => {
      (prompts as jest.MockedFunction<typeof prompts>).mockResolvedValue({
        tenantId: 'tenant-2',
      });

      const result = await selectTenant(mockTenants);

      expect(result).toBe('tenant-2');
      expect(prompts).toHaveBeenCalledWith({
        type: 'select',
        name: 'tenantId',
        message: 'Select a tenant to export users from:',
        choices: [
          {
            title: 'Contoso Ltd (contoso.onmicrosoft.com)',
            value: 'tenant-1',
            description: 'Tenant ID: tenant-1',
          },
          {
            title: 'Fabrikam Inc (fabrikam.onmicrosoft.com)',
            value: 'tenant-2',
            description: 'Tenant ID: tenant-2',
          },
          {
            title: 'Adventure Works (adventureworks.onmicrosoft.com)',
            value: 'tenant-3',
            description: 'Tenant ID: tenant-3',
          },
        ],
        initial: 0,
      });
    });

    it('should return null when user cancels selection', async () => {
      (prompts as jest.MockedFunction<typeof prompts>).mockResolvedValue({
        tenantId: undefined,
      });

      const result = await selectTenant(mockTenants);

      expect(result).toBeNull();
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Tenant selection cancelled'),
      );
    });

    it('should display selected tenant name after selection', async () => {
      (prompts as jest.MockedFunction<typeof prompts>).mockResolvedValue({
        tenantId: 'tenant-1',
      });

      await selectTenant(mockTenants);

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Selected tenant: Contoso Ltd'),
      );
    });

    it('should handle prompts error gracefully', async () => {
      (prompts as jest.MockedFunction<typeof prompts>).mockRejectedValue(
        new Error('Prompt error'),
      );

      const result = await selectTenant(mockTenants);

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Error during tenant selection'),
        expect.any(Error),
      );
    });

    it('should return tenant ID even if tenant is not found in list', async () => {
      // This tests edge case where response contains unknown tenant ID
      (prompts as jest.MockedFunction<typeof prompts>).mockResolvedValue({
        tenantId: 'unknown-tenant',
      });

      const result = await selectTenant(mockTenants);

      expect(result).toBe('unknown-tenant');
      // Should not display selected tenant name since it wasn't found
      expect(console.log).not.toHaveBeenCalledWith(
        expect.stringContaining('Selected tenant:'),
      );
    });
  });
});
