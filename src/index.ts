#!/usr/bin/env node

/**
 * Microsoft Entra ID User Export - TypeScript Implementation
 *
 * This script exports comprehensive user information from Microsoft Entra ID
 * using the Microsoft Graph API with batching and parallel processing for
 * significantly improved performance over the PowerShell implementation.
 *
 * Features:
 * - Batch API requests (up to 20 requests per batch)
 * - Parallel processing with configurable concurrency
 * - Exponential backoff retry logic for throttling
 * - Comprehensive error handling
 * - Progress tracking
 *
 * Performance: ~5-10x faster than PowerShell for large tenants
 */

import { getConfig } from './config';
import { createInitialGraphClient, initializeGraphClient } from './services/authService';
import { LicenseService } from './services/licenseService';
import { UserService } from './services/userService';
import { BatchService } from './services/batchService';
import { MfaService } from './services/mfaService';
import { GroupService } from './services/groupService';
import { UserProcessor } from './services/userProcessor';
import { CsvService } from './services/csvService';
import { TenantService } from './services/tenantService';
import { selectTenant } from './utils/tenantSelector';

/**
 * Main execution function
 */
async function main(): Promise<void> {
  console.log('\n' + '='.repeat(70));
  console.log('📊 MICROSOFT ENTRA ID USER EXPORT - TypeScript Edition');
  console.log('='.repeat(70) + '\n');

  try {
    // Get configuration
    const config = getConfig();

    // Step 1: Initial authentication with 'common' tenant to discover available tenants
    const initialClient = await createInitialGraphClient(config);

    // Step 2: Fetch available tenants
    const tenantService = new TenantService(initialClient);
    const availableTenants = await tenantService.getAvailableTenants();

    // Step 3: Let user select a tenant
    const selectedTenantId = await selectTenant(availableTenants);

    if (!selectedTenantId) {
      console.log('❌ No tenant selected. Exiting...\n');
      process.exit(0);
    }

    // Step 4: Re-authenticate with the selected tenant
    console.log('🔄 Re-authenticating with selected tenant...\n');
    const graphClient = await initializeGraphClient(config, selectedTenantId);

    // Create retry options
    const retryOptions = {
      maxRetries: config.maxRetries,
      retryDelayMs: config.retryDelayMs,
    };

    // Initialize services
    const licenseService = new LicenseService(graphClient, retryOptions);
    const userService = new UserService(graphClient, retryOptions);
    const batchService = new BatchService(graphClient, retryOptions);
    const mfaService = new MfaService(batchService);
    const groupService = new GroupService(graphClient, retryOptions);
    const userProcessor = new UserProcessor(
      mfaService,
      groupService,
      licenseService,
      config.maxConcurrency
    );
    const csvService = new CsvService(config.outputDir);

    // Build license SKU map
    await licenseService.buildLicenseSkuMap();

    // Check for Premium subscription
    const hasPremium = await licenseService.checkPremiumSubscription();

    // Get all users
    const users = await userService.getAllUsers(hasPremium);

    if (users.length === 0) {
      console.log('⚠️  No users found in the directory.');
      return;
    }

    // Process all users
    const processedData = await userProcessor.processAllUsers(users, hasPremium);

    // Export to CSV
    await csvService.exportToCSV(processedData);

    // Summary
    const stats = userProcessor.getStats();
    const totalTime = ((Date.now() - stats.startTime!) / 1000).toFixed(1);
    const avgRate = (stats.processed / parseFloat(totalTime)).toFixed(1);

    console.log('='.repeat(70));
    console.log('📈 EXPORT SUMMARY');
    console.log('='.repeat(70));
    console.log(`   Total users: ${stats.totalUsers}`);
    console.log(`   Successfully processed: ${stats.processed}`);
    console.log(`   Errors: ${stats.errors}`);
    console.log(`   Total time: ${totalTime}s`);
    console.log(`   Average rate: ${avgRate} users/sec`);
    console.log('='.repeat(70) + '\n');

    console.log('✨ Export completed successfully!\n');
  } catch (error) {
    const err = error as Error;
    console.error('\n❌ Fatal error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

// Run the script
main();
