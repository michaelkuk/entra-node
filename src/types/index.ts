/**
 * Type definitions for Microsoft Entra ID User Export
 */

/**
 * Microsoft Graph User properties
 */
export interface GraphUser {
  id: string;
  givenName?: string;
  surname?: string;
  displayName?: string;
  userPrincipalName?: string;
  mail?: string;
  jobTitle?: string;
  department?: string;
  companyName?: string;
  officeLocation?: string;
  employeeId?: string;
  mobilePhone?: string;
  businessPhones?: string[];
  streetAddress?: string;
  city?: string;
  postalCode?: string;
  state?: string;
  country?: string;
  userType?: string;
  onPremisesSyncEnabled?: boolean;
  accountEnabled?: boolean;
  createdDateTime?: string;
  assignedLicenses?: AssignedLicense[];
  signInActivity?: SignInActivity;
  manager?: Manager;
}

/**
 * Manager information
 */
export interface Manager {
  displayName?: string;
  userPrincipalName?: string;
}

/**
 * Sign-in activity (requires Entra ID Premium)
 */
export interface SignInActivity {
  lastSuccessfulSignInDateTime?: string;
}

/**
 * Assigned license
 */
export interface AssignedLicense {
  skuId: string;
  disabledPlans?: string[];
}

/**
 * License SKU information
 */
export interface LicenseSku {
  skuId: string;
  skuPartNumber: string;
  displayName: string;
  servicePlans: ServicePlan[];
}

/**
 * Service plan within a license
 */
export interface ServicePlan {
  servicePlanId: string;
  servicePlanName: string;
  provisioningStatus: string;
}

/**
 * MFA authentication method flags
 */
export interface MfaMethodFlags {
  emailAuth: boolean;
  fido2Auth: boolean;
  msAuthenticatorApp: boolean;
  msAuthenticatorLite: boolean;
  phoneAuth: boolean;
  softwareOath: boolean;
  temporaryAccessPass: boolean;
  windowsHello: boolean;
}

/**
 * Complete MFA information for a user
 */
export interface MfaInfo extends MfaMethodFlags {
  defaultMethod: string;
  mfaStatus: 'Enabled' | 'Disabled' | 'Unknown';
}

/**
 * Security group information
 */
export interface SecurityGroupInfo {
  groups: string[];
  count: number;
}

/**
 * License details with enabled service plans
 */
export interface LicenseDetails {
  licenseSkus: string[];
  licenseCount: number;
  servicePlans: string[];
}

/**
 * Processed user record for CSV export
 */
export interface ProcessedUserRecord {
  ID: string;
  'First name': string | undefined;
  'Last name': string | undefined;
  'Display name': string | undefined;
  'User principal name': string | undefined;
  'Domain name': string | null;
  'Email address': string | undefined;
  'Job title': string | undefined;
  'Manager display name': string | null;
  'Manager user principal name': string | null;
  Department: string | undefined;
  Company: string | undefined;
  Office: string | undefined;
  'Employee ID': string | undefined;
  Mobile: string | undefined;
  Phone: string | undefined;
  Street: string | undefined;
  City: string | undefined;
  'Postal code': string | undefined;
  State: string | undefined;
  Country: string | undefined;
  'User type': string | undefined;
  'On-Premises sync': string;
  'Account status': string;
  'Account Created on': string | undefined;
  'Last successful sign in': string;
  Licensed: string;
  DefaultMFAMethod: string;
  'MFA status': string;
  'Email authentication': boolean;
  'FIDO2 authentication': boolean;
  'Microsoft Authenticator App': boolean;
  'Microsoft Authenticator Lite': boolean;
  'Phone authentication': boolean;
  'Software Oath': boolean;
  'Temporary Access Pass': boolean;
  'Windows Hello for Business': boolean;
  'Security Groups': string;
  'Security Group Count': number;
  'License SKUs': string;
  'License Count': number;
  'Enabled Service Plans': string;
}

/**
 * Graph API batch request item
 */
export interface BatchRequestItem {
  id: string;
  method: string;
  url: string;
}

/**
 * Graph API batch request
 */
export interface BatchRequest {
  requests: BatchRequestItem[];
}

/**
 * Graph API batch response item
 */
export interface BatchResponseItem {
  id: string;
  status: number;
  body?: any;
}

/**
 * Graph API batch response
 */
export interface BatchResponse {
  responses: BatchResponseItem[];
}

/**
 * Processing statistics
 */
export interface ProcessingStats {
  totalUsers: number;
  processed: number;
  errors: number;
  startTime: number | null;
}

/**
 * SKU friendly name mapping from Microsoft CSV
 */
export interface SkuFriendlyNameMapping {
  stringId: string; // e.g., "ENTERPRISEPACK"
  guid: string; // e.g., "6fd2c87f-b296-42f0-b197-1e91e994b900"
  productDisplayName: string; // e.g., "Office 365 E3"
}

/**
 * Configuration options
 */
export interface Config {
  tenantId: string;
  clientId: string;
  scopes: string[];
  outputDir: string;
  maxConcurrency: number;
  batchSize: number;
  maxRetries: number;
  retryDelayMs: number;
}
