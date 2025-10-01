/**
 * Unit tests for CSV export service
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { CsvService } from '../../../src/services/csvService';
import { ProcessedUserRecord } from '../../../src/types';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock dependencies
jest.mock('fs/promises');
jest.mock('csv-writer');

const mockFs = fs as jest.Mocked<typeof fs>;

describe('CsvService', () => {
  let csvService: CsvService;
  const testOutputDir = './test-output';

  beforeEach(() => {
    jest.clearAllMocks();
    csvService = new CsvService(testOutputDir);
    mockFs.mkdir.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('exportToCSV', () => {
    const sampleData: ProcessedUserRecord[] = [
      {
        ID: '123',
        'First name': 'John',
        'Last name': 'Doe',
        'Display name': 'John Doe',
        'User principal name': 'john@example.com',
        'Domain name': 'example.com',
        'Email address': 'john@example.com',
        'Job title': 'Developer',
        'Manager display name': 'Jane Manager',
        'Manager user principal name': 'jane@example.com',
        Department: 'IT',
        Company: 'Acme Corp',
        Office: 'Building 1',
        'Employee ID': 'EMP001',
        Mobile: '+1234567890',
        Phone: '+0987654321',
        Street: '123 Main St',
        City: 'Anytown',
        'Postal code': '12345',
        State: 'CA',
        Country: 'US',
        'User type': 'Member',
        'On-Premises sync': 'disabled',
        'Account status': 'enabled',
        'Account Created on': '2020-01-01T00:00:00Z',
        'Last successful sign in': '2025-01-01T00:00:00Z',
        Licensed: 'Yes',
        DefaultMFAMethod: 'sms',
        'MFA status': 'Enabled',
        'Email authentication': true,
        'FIDO2 authentication': false,
        'Microsoft Authenticator App': true,
        'Microsoft Authenticator Lite': false,
        'Phone authentication': true,
        'Software Oath': false,
        'Temporary Access Pass': false,
        'Windows Hello for Business': false,
        'Security Groups': 'Group1; Group2',
        'Security Group Count': 2,
        'License SKUs': 'ENTERPRISEPACK',
        'License Count': 1,
        'Enabled Service Plans': 'EXCHANGE_S_ENTERPRISE; SHAREPOINTENTERPRISE',
      },
    ];

    it('should create output directory if it does not exist', async () => {
      const mockWriter = {
        writeRecords: jest.fn().mockResolvedValue(undefined),
      };

      const csvWriterModule = await import('csv-writer');
      (csvWriterModule.createObjectCsvWriter as any) = jest.fn().mockReturnValue(mockWriter);

      await csvService.exportToCSV(sampleData);

      expect(mockFs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining('test-output'),
        expect.objectContaining({ recursive: true }),
      );
    });

    it('should sort data by display name before export', async () => {
      const unsortedData: ProcessedUserRecord[] = [
        { ...sampleData[0], 'Display name': 'Zoe User' },
        { ...sampleData[0], 'Display name': 'Alice User' },
        { ...sampleData[0], 'Display name': 'Bob User' },
      ];

      const mockWriter = {
        writeRecords: jest.fn().mockResolvedValue(undefined),
      };

      const csvWriterModule = await import('csv-writer');
      (csvWriterModule.createObjectCsvWriter as any) = jest.fn().mockReturnValue(mockWriter);

      await csvService.exportToCSV(unsortedData);

      expect(mockWriter.writeRecords).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ 'Display name': 'Alice User' }),
          expect.objectContaining({ 'Display name': 'Bob User' }),
          expect.objectContaining({ 'Display name': 'Zoe User' }),
        ]),
      );
    });

    it('should return output path', async () => {
      const mockWriter = {
        writeRecords: jest.fn().mockResolvedValue(undefined),
      };

      const csvWriterModule = await import('csv-writer');
      (csvWriterModule.createObjectCsvWriter as any) = jest.fn().mockReturnValue(mockWriter);

      const result = await csvService.exportToCSV(sampleData);

      expect(result).toContain('test-output/AllEntraIDUsers_');
      expect(result).toContain('.csv');
    });

    it('should throw error if CSV write fails', async () => {
      const mockWriter = {
        writeRecords: jest.fn().mockRejectedValue(new Error('Write failed')),
      };

      const csvWriterModule = await import('csv-writer');
      (csvWriterModule.createObjectCsvWriter as any) = jest.fn().mockReturnValue(mockWriter);

      await expect(csvService.exportToCSV(sampleData)).rejects.toThrow('Write failed');
    });

    it('should handle empty display names in sort', async () => {
      const dataWithEmptyNames: ProcessedUserRecord[] = [
        { ...sampleData[0], 'Display name': undefined },
        { ...sampleData[0], 'Display name': 'Alice' },
        { ...sampleData[0], 'Display name': undefined },
      ];

      const mockWriter = {
        writeRecords: jest.fn().mockResolvedValue(undefined),
      };

      const csvWriterModule = await import('csv-writer');
      (csvWriterModule.createObjectCsvWriter as any) = jest.fn().mockReturnValue(mockWriter);

      await expect(csvService.exportToCSV(dataWithEmptyNames)).resolves.toBeDefined();
    });
  });
});
