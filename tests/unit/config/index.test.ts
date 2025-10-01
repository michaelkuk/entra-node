/**
 * Unit tests for configuration module
 */

import { describe, it, expect } from '@jest/globals';
import { CONFIG, getConfig } from '../../../src/config';

describe('Configuration Module', () => {
  describe('CONFIG', () => {
    it('should have default tenant ID', () => {
      expect(CONFIG.tenantId).toBe('common');
    });

    it('should have valid client ID', () => {
      expect(CONFIG.clientId).toBe('14d82eec-204b-4c2f-b7e8-296a70dab67e');
    });

    it('should have required scopes', () => {
      expect(CONFIG.scopes).toContain('User.Read.All');
      expect(CONFIG.scopes).toContain('UserAuthenticationMethod.Read.All');
      expect(CONFIG.scopes).toContain('AuditLog.Read.All');
      expect(CONFIG.scopes).toContain('Organization.Read.All');
      expect(CONFIG.scopes).toContain('Group.Read.All');
      expect(CONFIG.scopes).toContain('Directory.Read.All');
    });

    it('should have output directory configured', () => {
      expect(CONFIG.outputDir).toBe('./output');
    });

    it('should have maxConcurrency set to 10', () => {
      expect(CONFIG.maxConcurrency).toBe(10);
    });

    it('should have batchSize set to 20', () => {
      expect(CONFIG.batchSize).toBe(20);
    });

    it('should have maxRetries set to 3', () => {
      expect(CONFIG.maxRetries).toBe(3);
    });

    it('should have retryDelayMs set to 2000', () => {
      expect(CONFIG.retryDelayMs).toBe(2000);
    });
  });

  describe('getConfig', () => {
    it('should return default config when no overrides provided', () => {
      const config = getConfig();
      expect(config).toEqual(CONFIG);
    });

    it('should override maxConcurrency', () => {
      const config = getConfig({ maxConcurrency: 5 });
      expect(config.maxConcurrency).toBe(5);
      expect(config.tenantId).toBe(CONFIG.tenantId);
    });

    it('should override multiple properties', () => {
      const config = getConfig({
        maxConcurrency: 15,
        retryDelayMs: 3000,
        outputDir: './custom-output',
      });
      expect(config.maxConcurrency).toBe(15);
      expect(config.retryDelayMs).toBe(3000);
      expect(config.outputDir).toBe('./custom-output');
      expect(config.tenantId).toBe(CONFIG.tenantId);
    });

    it('should not mutate original CONFIG', () => {
      const originalMaxConcurrency = CONFIG.maxConcurrency;
      getConfig({ maxConcurrency: 99 });
      expect(CONFIG.maxConcurrency).toBe(originalMaxConcurrency);
    });
  });
});
