/**
 * Integration tests for GraphService
 * These tests are skipped by default and should only run in integration test environments
 * They require real Azure credentials and permissions
 */

import { GraphService } from '../../src/services/graphService';
import { DeviceCodeCredential } from '@azure/identity';

// Skip these tests by default - only run with npm run test:integration
describe.skip('GraphService Integration Tests', () => {
  let graphService: GraphService;
  let credential: DeviceCodeCredential;

  beforeAll(() => {
    // These tests require real Azure credentials
    // Set up environment variables: AZURE_TENANT_ID, AZURE_CLIENT_ID
    const tenantId = process.env.AZURE_TENANT_ID;
    const clientId = process.env.AZURE_CLIENT_ID;

    if (!tenantId || !clientId) {
      throw new Error(
        'AZURE_TENANT_ID and AZURE_CLIENT_ID environment variables are required for integration tests',
      );
    }

    credential = new DeviceCodeCredential({
      tenantId,
      clientId,
    });

    graphService = new GraphService(credential);
  }, 60000); // 60 second timeout for authentication

  describe('Real API Calls', () => {
    it(
      'should fetch users from real Microsoft Graph API',
      async () => {
        const users = await graphService.getUsers();

        expect(users).toBeDefined();
        expect(Array.isArray(users)).toBe(true);
        if (users.length > 0) {
          expect(users[0]).toHaveProperty('id');
          expect(users[0]).toHaveProperty('displayName');
          expect(users[0]).toHaveProperty('userPrincipalName');
        }
      },
      30000,
    ); // 30 second timeout

    it(
      'should fetch a specific user by ID',
      async () => {
        // First get a user to test with
        const users = await graphService.getUsers();
        if (users.length === 0) {
          console.warn('No users found to test with');
          return;
        }

        const testUserId = users[0].id;
        const user = await graphService.getUserById(testUserId);

        expect(user).toBeDefined();
        expect(user.id).toBe(testUserId);
        expect(user.displayName).toBeDefined();
      },
      30000,
    );

    it(
      'should fetch user groups',
      async () => {
        const users = await graphService.getUsers();
        if (users.length === 0) {
          console.warn('No users found to test with');
          return;
        }

        const testUserId = users[0].id;
        const groups = await graphService.getUserGroups(testUserId);

        expect(Array.isArray(groups)).toBe(true);
        // User might not have any groups, which is valid
      },
      30000,
    );
  });
});
