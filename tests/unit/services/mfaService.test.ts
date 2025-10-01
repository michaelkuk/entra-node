/**
 * Unit tests for MFA service
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { MfaService } from '../../../src/services/mfaService';
import { BatchService } from '../../../src/services/batchService';

const mockBatchService = {
  createBatchRequest: jest.fn(),
  executeBatch: jest.fn(),
};

describe('MfaService', () => {
  let mfaService: MfaService;

  beforeEach(() => {
    jest.clearAllMocks();
    mfaService = new MfaService(mockBatchService as any);
  });

  describe('getUserMfaInfo', () => {
    it('should return MFA info with all methods disabled', async () => {
      mockBatchService.createBatchRequest.mockReturnValue({
        requests: [
          { id: '1', method: 'GET', url: '/users/123/authentication/methods' },
          { id: '2', method: 'GET', url: '/users/123/authentication/signInPreferences' },
        ],
      });

      mockBatchService.executeBatch.mockResolvedValue({
        responses: [
          { id: '1', status: 200, body: { value: [] } },
          { id: '2', status: 200, body: {} },
        ],
      });

      const result = await mfaService.getUserMfaInfo('123');

      expect(result).toEqual({
        defaultMethod: 'Not set',
        mfaStatus: 'Disabled',
        emailAuth: false,
        fido2Auth: false,
        msAuthenticatorApp: false,
        msAuthenticatorLite: false,
        phoneAuth: false,
        softwareOath: false,
        temporaryAccessPass: false,
        windowsHello: false,
      });
    });

    it('should detect email authentication method', async () => {
      mockBatchService.createBatchRequest.mockReturnValue({
        requests: [],
      });

      mockBatchService.executeBatch.mockResolvedValue({
        responses: [
          {
            id: '1',
            status: 200,
            body: {
              value: [{ '@odata.type': '#microsoft.graph.emailAuthenticationMethod' }],
            },
          },
          { id: '2', status: 200, body: {} },
        ],
      });

      const result = await mfaService.getUserMfaInfo('123');

      expect(result.emailAuth).toBe(true);
      expect(result.mfaStatus).toBe('Enabled');
    });

    it('should detect FIDO2 authentication method', async () => {
      mockBatchService.createBatchRequest.mockReturnValue({
        requests: [],
      });

      mockBatchService.executeBatch.mockResolvedValue({
        responses: [
          {
            id: '1',
            status: 200,
            body: {
              value: [{ '@odata.type': '#microsoft.graph.fido2AuthenticationMethod' }],
            },
          },
          { id: '2', status: 200, body: {} },
        ],
      });

      const result = await mfaService.getUserMfaInfo('123');

      expect(result.fido2Auth).toBe(true);
      expect(result.mfaStatus).toBe('Enabled');
    });

    it('should detect Microsoft Authenticator App', async () => {
      mockBatchService.createBatchRequest.mockReturnValue({
        requests: [],
      });

      mockBatchService.executeBatch.mockResolvedValue({
        responses: [
          {
            id: '1',
            status: 200,
            body: {
              value: [
                {
                  '@odata.type': '#microsoft.graph.microsoftAuthenticatorAuthenticationMethod',
                  deviceTag: 'SoftwareTokenActivated',
                },
              ],
            },
          },
          { id: '2', status: 200, body: {} },
        ],
      });

      const result = await mfaService.getUserMfaInfo('123');

      expect(result.msAuthenticatorApp).toBe(true);
      expect(result.mfaStatus).toBe('Enabled');
    });

    it('should detect Microsoft Authenticator Lite', async () => {
      mockBatchService.createBatchRequest.mockReturnValue({
        requests: [],
      });

      mockBatchService.executeBatch.mockResolvedValue({
        responses: [
          {
            id: '1',
            status: 200,
            body: {
              value: [
                {
                  '@odata.type': '#microsoft.graph.microsoftAuthenticatorAuthenticationMethod',
                  deviceTag: 'Other',
                },
              ],
            },
          },
          { id: '2', status: 200, body: {} },
        ],
      });

      const result = await mfaService.getUserMfaInfo('123');

      expect(result.msAuthenticatorLite).toBe(true);
      expect(result.mfaStatus).toBe('Enabled');
    });

    it('should detect phone authentication method', async () => {
      mockBatchService.createBatchRequest.mockReturnValue({
        requests: [],
      });

      mockBatchService.executeBatch.mockResolvedValue({
        responses: [
          {
            id: '1',
            status: 200,
            body: {
              value: [{ '@odata.type': '#microsoft.graph.phoneAuthenticationMethod' }],
            },
          },
          { id: '2', status: 200, body: {} },
        ],
      });

      const result = await mfaService.getUserMfaInfo('123');

      expect(result.phoneAuth).toBe(true);
      expect(result.mfaStatus).toBe('Enabled');
    });

    it('should detect multiple authentication methods', async () => {
      mockBatchService.createBatchRequest.mockReturnValue({
        requests: [],
      });

      mockBatchService.executeBatch.mockResolvedValue({
        responses: [
          {
            id: '1',
            status: 200,
            body: {
              value: [
                { '@odata.type': '#microsoft.graph.emailAuthenticationMethod' },
                { '@odata.type': '#microsoft.graph.phoneAuthenticationMethod' },
                { '@odata.type': '#microsoft.graph.windowsHelloForBusinessAuthenticationMethod' },
              ],
            },
          },
          { id: '2', status: 200, body: { userPreferredMethodForSecondaryAuthentication: 'sms' } },
        ],
      });

      const result = await mfaService.getUserMfaInfo('123');

      expect(result.emailAuth).toBe(true);
      expect(result.phoneAuth).toBe(true);
      expect(result.windowsHello).toBe(true);
      expect(result.mfaStatus).toBe('Enabled');
      expect(result.defaultMethod).toBe('sms');
    });

    it('should handle API errors gracefully', async () => {
      mockBatchService.createBatchRequest.mockReturnValue({
        requests: [],
      });

      mockBatchService.executeBatch.mockRejectedValue(new Error('API Error'));

      const result = await mfaService.getUserMfaInfo('123');

      expect(result).toEqual({
        defaultMethod: 'Error',
        mfaStatus: 'Unknown',
        emailAuth: false,
        fido2Auth: false,
        msAuthenticatorApp: false,
        msAuthenticatorLite: false,
        phoneAuth: false,
        softwareOath: false,
        temporaryAccessPass: false,
        windowsHello: false,
      });
    });

    it('should handle failed batch responses', async () => {
      mockBatchService.createBatchRequest.mockReturnValue({
        requests: [],
      });

      mockBatchService.executeBatch.mockResolvedValue({
        responses: [
          { id: '1', status: 404, body: { error: 'Not found' } },
          { id: '2', status: 403, body: { error: 'Forbidden' } },
        ],
      });

      const result = await mfaService.getUserMfaInfo('123');

      expect(result.mfaStatus).toBe('Disabled');
      expect(result.defaultMethod).toBe('Not set');
    });
  });
});
