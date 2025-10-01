/**
 * Microsoft Graph API service
 * Example module to demonstrate integration testing with mocks
 */

import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredential } from '@azure/identity';

export interface User {
  id: string;
  displayName: string;
  userPrincipalName: string;
  mail?: string;
  jobTitle?: string;
  department?: string;
}

export class GraphService {
  private client: Client;

  constructor(credential: TokenCredential) {
    this.client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: async () => {
          const token = await credential.getToken(['https://graph.microsoft.com/.default']);
          return token?.token || '';
        },
      },
    });
  }

  /**
   * Get all users from Entra ID
   */
  async getUsers(): Promise<User[]> {
    try {
      const response = await this.client
        .api('/users')
        .select('id,displayName,userPrincipalName,mail,jobTitle,department')
        .top(999)
        .get();

      return response.value || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      throw new Error('Failed to fetch users from Microsoft Graph');
    }
  }

  /**
   * Get a single user by ID
   */
  async getUserById(userId: string): Promise<User> {
    try {
      const user = await this.client
        .api(`/users/${userId}`)
        .select('id,displayName,userPrincipalName,mail,jobTitle,department')
        .get();

      return user;
    } catch (error) {
      console.error(`Error fetching user ${userId}:`, error);
      throw new Error(`Failed to fetch user ${userId}`);
    }
  }

  /**
   * Get user's manager
   */
  async getUserManager(userId: string): Promise<User | null> {
    try {
      const manager = await this.client
        .api(`/users/${userId}/manager`)
        .select('id,displayName,userPrincipalName,mail')
        .get();

      return manager;
    } catch {
      // Manager might not exist, return null instead of throwing
      return null;
    }
  }

  /**
   * Get user's group memberships (security groups only)
   */
  async getUserGroups(userId: string): Promise<string[]> {
    try {
      const response = await this.client
        .api(`/users/${userId}/memberOf`)
        .filter('securityEnabled eq true')
        .select('displayName')
        .get();

      return response.value?.map((group: any) => group.displayName || '') || [];
    } catch (error) {
      console.error(`Error fetching groups for user ${userId}:`, error);
      return [];
    }
  }
}
