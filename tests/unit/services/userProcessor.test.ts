/**
 * Unit tests for user processor
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { UserProcessor } from '../../../src/services/userProcessor';
import { GraphUser } from '../../../src/types';

// Mock p-limit
jest.mock('p-limit');

const mockMfaService = {
  getUserMfaInfo: jest.fn(),
};

const mockGroupService = {
  getUserSecurityGroups: jest.fn(),
};

const mockLicenseService = {
  getUserLicenseDetails: jest.fn(),
};

describe('UserProcessor', () => {
  let userProcessor: UserProcessor;

  beforeEach(() => {
    jest.clearAllMocks();
    userProcessor = new UserProcessor(
      mockMfaService as any,
      mockGroupService as any,
      mockLicenseService as any,
      10,
    );
  });

  describe('getStats', () => {
    it('should return initial stats', () => {
      const stats = userProcessor.getStats();
      expect(stats).toEqual({
        totalUsers: 0,
        processed: 0,
        errors: 0,
        startTime: null,
      });
    });
  });

  describe('processAllUsers', () => {
    const sampleUser: GraphUser = {
      id: '123',
      givenName: 'John',
      surname: 'Doe',
      displayName: 'John Doe',
      userPrincipalName: 'john@example.com',
      mail: 'john@example.com',
      jobTitle: 'Developer',
      department: 'IT',
      companyName: 'Acme Corp',
      accountEnabled: true,
      onPremisesSyncEnabled: false,
      assignedLicenses: [],
      businessPhones: ['+1234567890'],
      manager: {
        displayName: 'Jane Manager',
        userPrincipalName: 'jane@example.com',
      },
    };

    beforeEach(() => {
      mockMfaService.getUserMfaInfo.mockResolvedValue({
        defaultMethod: 'sms',
        mfaStatus: 'Enabled',
        emailAuth: true,
        fido2Auth: false,
        msAuthenticatorApp: false,
        msAuthenticatorLite: false,
        phoneAuth: true,
        softwareOath: false,
        temporaryAccessPass: false,
        windowsHello: false,
      });

      mockGroupService.getUserSecurityGroups.mockResolvedValue({
        groups: ['Group1', 'Group2'],
        count: 2,
      });

      mockLicenseService.getUserLicenseDetails.mockReturnValue({
        licenseSkus: ['ENTERPRISEPACK'],
        licenseCount: 1,
        servicePlans: ['EXCHANGE_S_ENTERPRISE'],
      });
    });

    it('should process single user successfully', async () => {
      const users = [sampleUser];
      const result = await userProcessor.processAllUsers(users, true);

      expect(result).toHaveLength(1);
      expect(result[0]['Display name']).toBe('John Doe');
      expect(result[0]['User principal name']).toBe('john@example.com');
      expect(result[0]['MFA status']).toBe('Enabled');
      expect(result[0]['Security Groups']).toBe('Group1; Group2');
      expect(result[0]['License SKUs']).toBe('ENTERPRISEPACK');
    });

    it('should process multiple users', async () => {
      const users = [
        sampleUser,
        { ...sampleUser, id: '456', displayName: 'Jane Smith' },
      ];

      const result = await userProcessor.processAllUsers(users, false);

      expect(result).toHaveLength(2);
      expect(mockMfaService.getUserMfaInfo).toHaveBeenCalledTimes(2);
      expect(mockGroupService.getUserSecurityGroups).toHaveBeenCalledTimes(2);
    });

    it('should handle user with no manager', async () => {
      const userWithoutManager = { ...sampleUser, manager: undefined };
      const result = await userProcessor.processAllUsers([userWithoutManager], false);

      expect(result[0]['Manager display name']).toBeNull();
      expect(result[0]['Manager user principal name']).toBeNull();
    });

    it('should extract domain from UPN', async () => {
      const result = await userProcessor.processAllUsers([sampleUser], false);

      expect(result[0]['Domain name']).toBe('example.com');
    });

    it('should handle UPN without domain', async () => {
      const userWithoutDomain = { ...sampleUser, userPrincipalName: 'nodomain' };
      const result = await userProcessor.processAllUsers([userWithoutDomain], false);

      expect(result[0]['Domain name']).toBeNull();
    });

    it('should show correct sign-in status with premium', async () => {
      const userWithSignIn = {
        ...sampleUser,
        signInActivity: {
          lastSuccessfulSignInDateTime: '2025-01-01T00:00:00Z',
        },
      };

      const result = await userProcessor.processAllUsers([userWithSignIn], true);

      expect(result[0]['Last successful sign in']).toBe('2025-01-01T00:00:00Z');
    });

    it('should show "No sign in" with premium but no activity', async () => {
      const result = await userProcessor.processAllUsers([sampleUser], true);

      expect(result[0]['Last successful sign in']).toBe('No sign in');
    });

    it('should show license message without premium', async () => {
      const result = await userProcessor.processAllUsers([sampleUser], false);

      expect(result[0]['Last successful sign in']).toBe(
        'No Microsoft Entra ID Premium license',
      );
    });

    it('should handle processing errors', async () => {
      mockMfaService.getUserMfaInfo.mockRejectedValue(new Error('MFA Error'));

      const result = await userProcessor.processAllUsers([sampleUser], false);

      expect(result).toHaveLength(0);
      const stats = userProcessor.getStats();
      expect(stats.errors).toBe(1);
    });

    it('should update statistics', async () => {
      await userProcessor.processAllUsers([sampleUser], false);

      const stats = userProcessor.getStats();
      expect(stats.totalUsers).toBe(1);
      expect(stats.processed).toBe(1);
      expect(stats.errors).toBe(0);
      expect(stats.startTime).not.toBeNull();
    });

    it('should handle licensed user', async () => {
      const licensedUser = {
        ...sampleUser,
        assignedLicenses: [{ skuId: 'sku-1', disabledPlans: [] }],
      };

      const result = await userProcessor.processAllUsers([licensedUser], false);

      expect(result[0].Licensed).toBe('Yes');
    });

    it('should handle unlicensed user', async () => {
      const result = await userProcessor.processAllUsers([sampleUser], false);

      expect(result[0].Licensed).toBe('No');
    });

    it('should handle account sync status', async () => {
      const syncedUser = { ...sampleUser, onPremisesSyncEnabled: true };
      const result = await userProcessor.processAllUsers([syncedUser], false);

      expect(result[0]['On-Premises sync']).toBe('enabled');
    });

    it('should handle account enabled status', async () => {
      const disabledUser = { ...sampleUser, accountEnabled: false };
      const result = await userProcessor.processAllUsers([disabledUser], false);

      expect(result[0]['Account status']).toBe('disabled');
    });

    it('should join business phones with commas', async () => {
      const userWithPhones = {
        ...sampleUser,
        businessPhones: ['+1234567890', '+0987654321'],
      };

      const result = await userProcessor.processAllUsers([userWithPhones], false);

      expect(result[0].Phone).toBe('+1234567890,+0987654321');
    });
  });
});
