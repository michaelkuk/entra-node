/**
 * Application configuration
 */

import { Config } from '../types';

/**
 * Default configuration for Entra ID export
 */
export const CONFIG: Config = {
  tenantId: 'common', // Use 'common' for multi-tenant or specific tenant ID
  clientId: '14d82eec-204b-4c2f-b7e8-296a70dab67e', // Microsoft Graph Command Line Tools (public client)
  scopes: [
    'User.Read.All',
    'UserAuthenticationMethod.Read.All',
    'AuditLog.Read.All',
    'Organization.Read.All',
    'Group.Read.All',
    'Directory.Read.All',
  ],
  outputDir: './output',
  maxConcurrency: 20, // Parallel requests
  batchSize: 20, // Microsoft Graph batch limit
  maxRetries: 3,
  retryDelayMs: 2000,
};

/**
 * Get configuration with optional overrides
 */
export function getConfig(overrides?: Partial<Config>): Config {
  return {
    ...CONFIG,
    ...overrides,
  };
}
