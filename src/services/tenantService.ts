/**
 * Service for fetching and managing Azure AD tenants
 */

import { Client } from '@microsoft/microsoft-graph-client';

/**
 * Tenant information from Microsoft Graph
 */
export interface TenantInfo {
  id: string;
  displayName: string;
  defaultDomain: string;
  tenantType?: string;
}

/**
 * Service for working with Azure AD tenants
 */
export class TenantService {
  constructor(private client: Client) {}

  /**
   * Fetch all available tenants for the authenticated user
   * Uses the /organization endpoint to get tenant details
   */
  async getAvailableTenants(): Promise<TenantInfo[]> {
    try {
      console.log('🔍 Fetching available tenants...');

      const response = await this.client
        .api('/organization')
        .select('id,displayName,verifiedDomains,tenantType')
        .get();

      const tenants: TenantInfo[] = [];

      // Process organizations
      if (response.value && Array.isArray(response.value)) {
        for (const org of response.value) {
          // Find the default domain
          const defaultDomain =
            org.verifiedDomains?.find((domain: any) => domain.isDefault)?.name ||
            org.verifiedDomains?.[0]?.name ||
            'unknown';

          tenants.push({
            id: org.id,
            displayName: org.displayName || 'Unnamed Organization',
            defaultDomain,
            tenantType: org.tenantType,
          });
        }
      }

      console.log(`✅ Found ${tenants.length} tenant(s)\n`);
      return tenants;
    } catch (error) {
      console.error('❌ Failed to fetch tenants:', error);
      throw new Error(
        'Unable to fetch available tenants. Make sure you have the necessary permissions.'
      );
    }
  }

  /**
   * Fetch tenant information for a specific tenant ID
   */
  async getTenantById(tenantId: string): Promise<TenantInfo | null> {
    try {
      const response = await this.client
        .api(`/organization/${tenantId}`)
        .select('id,displayName,verifiedDomains,tenantType')
        .get();

      if (!response) return null;

      const defaultDomain =
        response.verifiedDomains?.find((domain: any) => domain.isDefault)?.name ||
        response.verifiedDomains?.[0]?.name ||
        'unknown';

      return {
        id: response.id,
        displayName: response.displayName || 'Unnamed Organization',
        defaultDomain,
        tenantType: response.tenantType,
      };
    } catch (error) {
      console.error(`❌ Failed to fetch tenant ${tenantId}:`, error);
      return null;
    }
  }
}
