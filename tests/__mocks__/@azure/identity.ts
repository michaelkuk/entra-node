/**
 * Mock for Azure Identity
 * This mock allows testing authentication flows without real credentials
 */

export class DeviceCodeCredential {
  constructor(public options?: any) {}

  getToken = jest.fn().mockResolvedValue({
    token: 'mock-access-token',
    expiresOnTimestamp: Date.now() + 3600000,
  });
}

export class ClientSecretCredential {
  constructor(
    public tenantId: string,
    public clientId: string,
    public clientSecret: string,
  ) {}

  getToken = jest.fn().mockResolvedValue({
    token: 'mock-access-token',
    expiresOnTimestamp: Date.now() + 3600000,
  });
}

export class DefaultAzureCredential {
  constructor(public options?: any) {}

  getToken = jest.fn().mockResolvedValue({
    token: 'mock-access-token',
    expiresOnTimestamp: Date.now() + 3600000,
  });
}
