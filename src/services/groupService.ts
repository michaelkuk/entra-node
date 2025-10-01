/**
 * Security group service
 */

import { Client } from '@microsoft/microsoft-graph-client';
import { SecurityGroupInfo } from '../types';
import { retryWithBackoff, RetryOptions } from '../utils/retry';

/**
 * GroupService handles retrieval of user group memberships
 */
export class GroupService {
  private client: Client;
  private retryOptions: RetryOptions;

  constructor(client: Client, retryOptions: RetryOptions) {
    this.client = client;
    this.retryOptions = retryOptions;
  }

  /**
   * Get user's security groups
   */
  async getUserSecurityGroups(userId: string): Promise<SecurityGroupInfo> {
    try {
      const response = await retryWithBackoff(
        () => this.client.api(`/users/${userId}/memberOf`).get(),
        this.retryOptions
      );

      const securityGroups = response.value.filter(
        (group: any) => group['@odata.type'] === '#microsoft.graph.group' && group.securityEnabled
      );

      return {
        groups: securityGroups.map((g: any) => g.displayName).sort(),
        count: securityGroups.length,
      };
    } catch (error) {
      const err = error as Error;
      console.error(`⚠️  Failed to get groups for user ${userId}:`, err.message);
      return { groups: [], count: 0 };
    }
  }
}
