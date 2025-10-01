/**
 * User processing service with parallel execution
 */

import pLimit from 'p-limit';
import { GraphUser, ProcessedUserRecord, ProcessingStats } from '../types';
import { MfaService } from './mfaService';
import { GroupService } from './groupService';
import { LicenseService } from './licenseService';

/**
 * UserProcessor handles parallel processing of users
 */
export class UserProcessor {
  private mfaService: MfaService;
  private groupService: GroupService;
  private licenseService: LicenseService;
  private maxConcurrency: number;
  private stats: ProcessingStats;

  constructor(
    mfaService: MfaService,
    groupService: GroupService,
    licenseService: LicenseService,
    maxConcurrency: number
  ) {
    this.mfaService = mfaService;
    this.groupService = groupService;
    this.licenseService = licenseService;
    this.maxConcurrency = maxConcurrency;
    this.stats = {
      totalUsers: 0,
      processed: 0,
      errors: 0,
      startTime: null,
    };
  }

  /**
   * Get processing statistics
   */
  getStats(): ProcessingStats {
    return { ...this.stats };
  }

  /**
   * Process a single user - get all additional details
   */
  private async processUser(
    user: GraphUser,
    hasPremium: boolean
  ): Promise<ProcessedUserRecord | null> {
    try {
      // Fetch MFA info and security groups in parallel
      const [mfaInfo, securityGroups] = await Promise.all([
        this.mfaService.getUserMfaInfo(user.id),
        this.groupService.getUserSecurityGroups(user.id),
      ]);

      // Process license details (no API call needed, uses cache)
      const licenseDetails = this.licenseService.getUserLicenseDetails(user.assignedLicenses);

      // Extract domain from UPN safely
      const domainName = user.userPrincipalName?.includes('@')
        ? user.userPrincipalName.split('@')[1]
        : null;

      // Get manager info safely
      const managerDisplayName = user.manager?.displayName || null;
      const managerUserPrincipalName = user.manager?.userPrincipalName || null;

      // Get sign-in activity
      const lastSignIn =
        hasPremium && user.signInActivity?.lastSuccessfulSignInDateTime
          ? user.signInActivity.lastSuccessfulSignInDateTime
          : hasPremium
            ? 'No sign in'
            : 'No Microsoft Entra ID Premium license';

      this.stats.processed++;

      return {
        ID: user.id,
        'First name': user.givenName,
        'Last name': user.surname,
        'Display name': user.displayName,
        'User principal name': user.userPrincipalName,
        'Domain name': domainName,
        'Email address': user.mail,
        'Job title': user.jobTitle,
        'Manager display name': managerDisplayName,
        'Manager user principal name': managerUserPrincipalName,
        Department: user.department,
        Company: user.companyName,
        Office: user.officeLocation,
        'Employee ID': user.employeeId,
        Mobile: user.mobilePhone,
        Phone: user.businessPhones?.join(','),
        Street: user.streetAddress,
        City: user.city,
        'Postal code': user.postalCode,
        State: user.state,
        Country: user.country,
        'User type': user.userType,
        'On-Premises sync': user.onPremisesSyncEnabled ? 'enabled' : 'disabled',
        'Account status': user.accountEnabled ? 'enabled' : 'disabled',
        'Account Created on': user.createdDateTime,
        'Last successful sign in': lastSignIn,
        Licensed: user.assignedLicenses && user.assignedLicenses.length > 0 ? 'Yes' : 'No',
        DefaultMFAMethod: mfaInfo.defaultMethod,
        'MFA status': mfaInfo.mfaStatus,
        'Email authentication': mfaInfo.emailAuth,
        'FIDO2 authentication': mfaInfo.fido2Auth,
        'Microsoft Authenticator App': mfaInfo.msAuthenticatorApp,
        'Microsoft Authenticator Lite': mfaInfo.msAuthenticatorLite,
        'Phone authentication': mfaInfo.phoneAuth,
        'Software Oath': mfaInfo.softwareOath,
        'Temporary Access Pass': mfaInfo.temporaryAccessPass,
        'Windows Hello for Business': mfaInfo.windowsHello,
        'Security Groups': securityGroups.groups.join('; '),
        'Security Group Count': securityGroups.count,
        'License SKUs': licenseDetails.licenseSkus.join('; '),
        'License Count': licenseDetails.licenseCount,
        'Enabled Service Plans': licenseDetails.servicePlans.join('; '),
      };
    } catch (error) {
      this.stats.errors++;
      const err = error as Error;
      console.error(`\n❌ Error processing user ${user.userPrincipalName}:`, err.message);
      return null;
    }
  }

  /**
   * Process all users with parallel execution and progress tracking
   */
  async processAllUsers(users: GraphUser[], hasPremium: boolean): Promise<ProcessedUserRecord[]> {
    console.log('⚙️  Processing users with parallel execution...');
    console.log(`   Concurrency: ${this.maxConcurrency} parallel requests\n`);

    this.stats.totalUsers = users.length;
    this.stats.processed = 0;
    this.stats.errors = 0;
    this.stats.startTime = Date.now();

    const limit = pLimit(this.maxConcurrency);
    const progressInterval = global.setInterval(() => {
      const percent = ((this.stats.processed / this.stats.totalUsers) * 100).toFixed(1);
      const elapsed = ((Date.now() - this.stats.startTime!) / 1000).toFixed(0);
      const rate = (this.stats.processed / parseFloat(elapsed)).toFixed(1);
      process.stdout.write(
        `\r   Progress: ${this.stats.processed}/${this.stats.totalUsers} (${percent}%) | ` +
          `Rate: ${rate} users/sec | Errors: ${this.stats.errors} | Elapsed: ${elapsed}s`
      );
    }, 500);

    const results = await Promise.all(
      users.map((user) => limit(() => this.processUser(user, hasPremium)))
    );

    global.clearInterval(progressInterval);

    const finalPercent = ((this.stats.processed / this.stats.totalUsers) * 100).toFixed(1);
    const finalElapsed = ((Date.now() - this.stats.startTime!) / 1000).toFixed(0);
    const finalRate = (this.stats.processed / parseFloat(finalElapsed)).toFixed(1);
    console.log(
      `\r   Progress: ${this.stats.processed}/${this.stats.totalUsers} (${finalPercent}%) | ` +
        `Rate: ${finalRate} users/sec | Errors: ${this.stats.errors} | Elapsed: ${finalElapsed}s`
    );

    console.log('\n✅ User processing complete\n');

    return results.filter((r): r is ProcessedUserRecord => r !== null);
  }
}
