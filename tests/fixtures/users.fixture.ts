/**
 * Test fixtures for Entra ID user data
 * Use these fixtures in your tests for consistent, realistic test data
 */

export const mockEntraUser = {
  id: '12345678-1234-1234-1234-123456789012',
  displayName: 'John Doe',
  givenName: 'John',
  surname: 'Doe',
  userPrincipalName: 'john.doe@contoso.com',
  mail: 'john.doe@contoso.com',
  jobTitle: 'Software Engineer',
  department: 'Engineering',
  officeLocation: 'Building 1',
  mobilePhone: '+1 555-0100',
  businessPhones: ['+1 555-0101'],
  accountEnabled: true,
  createdDateTime: '2024-01-01T00:00:00Z',
  lastPasswordChangeDateTime: '2024-01-15T00:00:00Z',
};

export const mockEntraUsers = [
  mockEntraUser,
  {
    id: '87654321-4321-4321-4321-210987654321',
    displayName: 'Jane Smith',
    givenName: 'Jane',
    surname: 'Smith',
    userPrincipalName: 'jane.smith@contoso.com',
    mail: 'jane.smith@contoso.com',
    jobTitle: 'Product Manager',
    department: 'Product',
    officeLocation: 'Building 2',
    mobilePhone: '+1 555-0200',
    businessPhones: ['+1 555-0201'],
    accountEnabled: true,
    createdDateTime: '2024-02-01T00:00:00Z',
    lastPasswordChangeDateTime: '2024-02-15T00:00:00Z',
  },
];

export const mockUserWithManager = {
  ...mockEntraUser,
  manager: {
    id: '99999999-9999-9999-9999-999999999999',
    displayName: 'Manager Name',
    mail: 'manager@contoso.com',
  },
};

export const mockAuthenticationMethods = [
  {
    '@odata.type': '#microsoft.graph.emailAuthenticationMethod',
    id: 'email-method-id',
    emailAddress: 'john.doe@contoso.com',
  },
  {
    '@odata.type': '#microsoft.graph.phoneAuthenticationMethod',
    id: 'phone-method-id',
    phoneNumber: '+1 555-0100',
    phoneType: 'mobile',
  },
];

export const mockSignInActivity = {
  lastSignInDateTime: '2024-09-30T10:00:00Z',
  lastNonInteractiveSignInDateTime: '2024-09-30T09:00:00Z',
};

export const mockLicenses = [
  {
    skuId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    skuPartNumber: 'ENTERPRISEPACK',
    servicePlans: [
      {
        servicePlanId: 'plan-1',
        servicePlanName: 'EXCHANGE_S_ENTERPRISE',
        provisioningStatus: 'Success',
      },
      {
        servicePlanId: 'plan-2',
        servicePlanName: 'SHAREPOINTENTERPRISE',
        provisioningStatus: 'Success',
      },
    ],
  },
];

export const mockGroups = [
  {
    id: 'group-1-id',
    displayName: 'Security Group 1',
    mailNickname: 'security-group-1',
    securityEnabled: true,
    mailEnabled: false,
  },
  {
    id: 'group-2-id',
    displayName: 'Security Group 2',
    mailNickname: 'security-group-2',
    securityEnabled: true,
    mailEnabled: false,
  },
];
