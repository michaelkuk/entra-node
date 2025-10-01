/**
 * MFA (Multi-Factor Authentication) service
 */

import { MfaInfo } from '../types';
import { BatchService } from './batchService';

/**
 * MfaService handles retrieval of MFA methods and preferences
 */
export class MfaService {
  private batchService: BatchService;

  constructor(batchService: BatchService) {
    this.batchService = batchService;
  }

  /**
   * Get user's MFA methods and default preference
   */
  async getUserMfaInfo(userId: string): Promise<MfaInfo> {
    const batchRequest = this.batchService.createBatchRequest([
      `/users/${userId}/authentication/methods`,
      `/users/${userId}/authentication/signInPreferences`,
    ]);

    try {
      const response = await this.batchService.executeBatch(batchRequest);

      const mfaMethods =
        response.responses[0]?.status === 200 ? response.responses[0].body.value : [];
      const mfaPreference = response.responses[1]?.status === 200 ? response.responses[1].body : {};

      const methodFlags = {
        emailAuth: false,
        fido2Auth: false,
        msAuthenticatorApp: false,
        msAuthenticatorLite: false,
        phoneAuth: false,
        softwareOath: false,
        temporaryAccessPass: false,
        windowsHello: false,
      };

      let mfaStatus: 'Enabled' | 'Disabled' | 'Unknown' = 'Disabled';

      mfaMethods.forEach((method: any) => {
        const odataType = method['@odata.type'];

        if (odataType === '#microsoft.graph.emailAuthenticationMethod') {
          methodFlags.emailAuth = true;
          mfaStatus = 'Enabled';
        } else if (odataType === '#microsoft.graph.fido2AuthenticationMethod') {
          methodFlags.fido2Auth = true;
          mfaStatus = 'Enabled';
        } else if (odataType === '#microsoft.graph.microsoftAuthenticatorAuthenticationMethod') {
          if (method.deviceTag === 'SoftwareTokenActivated') {
            methodFlags.msAuthenticatorApp = true;
          } else {
            methodFlags.msAuthenticatorLite = true;
          }
          mfaStatus = 'Enabled';
        } else if (odataType === '#microsoft.graph.phoneAuthenticationMethod') {
          methodFlags.phoneAuth = true;
          mfaStatus = 'Enabled';
        } else if (odataType === '#microsoft.graph.softwareOathAuthenticationMethod') {
          methodFlags.softwareOath = true;
          mfaStatus = 'Enabled';
        } else if (odataType === '#microsoft.graph.temporaryAccessPassAuthenticationMethod') {
          methodFlags.temporaryAccessPass = true;
          mfaStatus = 'Enabled';
        } else if (odataType === '#microsoft.graph.windowsHelloForBusinessAuthenticationMethod') {
          methodFlags.windowsHello = true;
          mfaStatus = 'Enabled';
        }
      });

      return {
        defaultMethod: mfaPreference.userPreferredMethodForSecondaryAuthentication || 'Not set',
        mfaStatus,
        ...methodFlags,
      };
    } catch (error) {
      const err = error as Error;
      console.error(`⚠️  Failed to get MFA info for user ${userId}:`, err.message);
      return {
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
      };
    }
  }
}
