/**
 * Utility for interactive tenant selection
 */

import prompts from 'prompts';
import { TenantInfo } from '../services/tenantService';

/**
 * Prompt user to select a tenant from available tenants
 * @param tenants - List of available tenants
 * @returns Selected tenant ID or null if cancelled
 */
export async function selectTenant(tenants: TenantInfo[]): Promise<string | null> {
  if (tenants.length === 0) {
    console.error('❌ No tenants available for selection.');
    return null;
  }

  // If only one tenant, auto-select it
  if (tenants.length === 1) {
    console.log(`\n✅ Auto-selecting only available tenant: ${tenants[0].displayName}\n`);
    return tenants[0].id;
  }

  // Display available tenants
  console.log('\n' + '='.repeat(70));
  console.log('🏢 AVAILABLE TENANTS');
  console.log('='.repeat(70) + '\n');

  const choices = tenants.map((tenant) => ({
    title: `${tenant.displayName} (${tenant.defaultDomain})`,
    value: tenant.id,
    description: `Tenant ID: ${tenant.id}`,
  }));

  try {
    const response = await prompts({
      type: 'select',
      name: 'tenantId',
      message: 'Select a tenant to export users from:',
      choices,
      initial: 0,
    });

    if (!response.tenantId) {
      console.log('\n⚠️  Tenant selection cancelled.\n');
      return null;
    }

    const selectedTenant = tenants.find((t) => t.id === response.tenantId);
    if (selectedTenant) {
      console.log(`\n✅ Selected tenant: ${selectedTenant.displayName}\n`);
    }

    return response.tenantId;
  } catch (error) {
    console.error('\n❌ Error during tenant selection:', error);
    return null;
  }
}
