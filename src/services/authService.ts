/**
 * Authentication service for Microsoft Graph API
 */

import { DeviceCodeCredential, DeviceCodeInfo } from '@azure/identity';
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { Config } from '../types';

/**
 * Initialize Microsoft Graph client with device code authentication
 * @param tenantId - The tenant ID to authenticate against (defaults to 'common')
 */
export async function initializeGraphClient(config: Config, tenantId?: string): Promise<Client> {
  console.log('🔐 Initializing authentication...');

  const effectiveTenantId = tenantId || config.tenantId;

  const credential = new DeviceCodeCredential({
    tenantId: effectiveTenantId,
    clientId: config.clientId,
    userPromptCallback: (info: DeviceCodeInfo) => {
      console.log('\n' + '='.repeat(70));
      console.log('📱 DEVICE CODE AUTHENTICATION');
      console.log('='.repeat(70));
      console.log(`\n${info.message}\n`);
      console.log('='.repeat(70) + '\n');
    },
  });

  const authProvider = new TokenCredentialAuthenticationProvider(credential, {
    scopes: config.scopes,
  });

  const client = Client.initWithMiddleware({ authProvider });

  console.log('✅ Successfully authenticated to Microsoft Graph\n');

  return client;
}

/**
 * Create an initial Graph client using 'common' tenant for discovering available tenants
 */
export async function createInitialGraphClient(config: Config): Promise<Client> {
  return initializeGraphClient(config, 'common');
}
