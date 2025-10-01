/**
 * License SKU management service
 */

import { Client } from '@microsoft/microsoft-graph-client';
import { LicenseSku, LicenseDetails, AssignedLicense } from '../types';
import { retryWithBackoff, RetryOptions } from '../utils/retry';

/**
 * LicenseService manages license SKU mapping and retrieval
 */
export class LicenseService {
  private licenseSkuMap: Map<string, LicenseSku> = new Map();
  private client: Client;
  private retryOptions: RetryOptions;

  constructor(client: Client, retryOptions: RetryOptions) {
    this.client = client;
    this.retryOptions = retryOptions;
  }

  /**
   * Build license SKU mapping cache
   */
  async buildLicenseSkuMap(): Promise<void> {
    console.log('📦 Building license SKU mapping...');

    try {
      const response = await retryWithBackoff(
        () => this.client.api('/subscribedSkus').get(),
        this.retryOptions
      );

      response.value.forEach((sku: any) => {
        this.licenseSkuMap.set(sku.skuId, {
          skuId: sku.skuId,
          skuPartNumber: sku.skuPartNumber,
          displayName: sku.skuPartNumber || sku.skuId,
          servicePlans: sku.servicePlans,
        });
      });

      console.log(`✅ Cached ${this.licenseSkuMap.size} license SKUs\n`);
    } catch (error) {
      const err = error as Error;
      console.error('⚠️  Failed to build license SKU mapping:', err.message);
      console.log('   License information will show SKU IDs instead of friendly names\n');
    }
  }

  /**
   * Check for Entra ID Premium subscription
   */
  async checkPremiumSubscription(): Promise<boolean> {
    console.log('🔍 Checking for Entra ID Premium subscription...');

    try {
      const response = await retryWithBackoff(
        () => this.client.api('/subscribedSkus').get(),
        this.retryOptions
      );

      const hasPremium = response.value.some((sku: any) =>
        sku.servicePlans.some((plan: any) => plan.servicePlanName === 'AAD_PREMIUM')
      );

      if (hasPremium) {
        console.log('✅ Microsoft Entra ID Premium subscription available\n');
      } else {
        console.log('ℹ️  Microsoft Entra ID Premium subscription not available\n');
      }

      return hasPremium;
    } catch (error) {
      const err = error as Error;
      console.error('⚠️  Failed to check subscription:', err.message);
      return false;
    }
  }

  /**
   * Get user's license details with enabled service plans
   */
  getUserLicenseDetails(assignedLicenses?: AssignedLicense[]): LicenseDetails {
    if (!assignedLicenses || assignedLicenses.length === 0) {
      return {
        licenseSkus: [],
        licenseCount: 0,
        servicePlans: [],
      };
    }

    const licenseNames: string[] = [];
    const allServicePlans = new Set<string>();

    assignedLicenses.forEach((license) => {
      const skuInfo = this.licenseSkuMap.get(license.skuId);

      if (skuInfo) {
        licenseNames.push(skuInfo.displayName);

        // Get enabled service plans
        const disabledPlans = license.disabledPlans || [];
        skuInfo.servicePlans.forEach((plan) => {
          if (
            !disabledPlans.includes(plan.servicePlanId) &&
            plan.provisioningStatus === 'Success'
          ) {
            allServicePlans.add(plan.servicePlanName);
          }
        });
      } else {
        licenseNames.push(license.skuId);
      }
    });

    return {
      licenseSkus: [...new Set(licenseNames)].sort(),
      licenseCount: assignedLicenses.length,
      servicePlans: Array.from(allServicePlans).sort(),
    };
  }
}
