/**
 * User retrieval service
 */

import { Client } from '@microsoft/microsoft-graph-client';
import { GraphUser } from '../types';
import { retryWithBackoff, RetryOptions } from '../utils/retry';

/**
 * UserService handles fetching users from Microsoft Graph
 */
export class UserService {
  private client: Client;
  private retryOptions: RetryOptions;

  constructor(client: Client, retryOptions: RetryOptions) {
    this.client = client;
    this.retryOptions = retryOptions;
  }

  /**
   * Get all users with pagination
   */
  async getAllUsers(hasPremium: boolean): Promise<GraphUser[]> {
    console.log('👥 Retrieving all users...');

    const properties = [
      'id',
      'givenName',
      'surname',
      'displayName',
      'userPrincipalName',
      'mail',
      'jobTitle',
      'department',
      'companyName',
      'officeLocation',
      'employeeId',
      'mobilePhone',
      'businessPhones',
      'streetAddress',
      'city',
      'postalCode',
      'state',
      'country',
      'userType',
      'onPremisesSyncEnabled',
      'accountEnabled',
      'createdDateTime',
      'assignedLicenses',
    ];

    if (hasPremium) {
      properties.push('signInActivity');
    }

    let users: GraphUser[] = [];
    let nextLink: string | null =
      `/users?$select=${properties.join(',')}&$expand=manager($select=displayName,userPrincipalName)&$top=999`;

    try {
      while (nextLink) {
        const response = await retryWithBackoff(
          () => this.client.api(nextLink!).get(),
          this.retryOptions
        );

        users = users.concat(response.value);
        nextLink = response['@odata.nextLink']
          ? response['@odata.nextLink'].split('/v1.0')[1]
          : null;

        process.stdout.write(`\r   Retrieved ${users.length} users...`);
      }

      console.log(`\n✅ Found ${users.length} users\n`);
      return users;
    } catch (error) {
      const err = error as Error;
      console.error('\n❌ Failed to retrieve users:', err.message);
      throw error;
    }
  }
}
