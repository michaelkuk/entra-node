/**
 * Unit tests for SKU mapping service
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { SkuMappingService } from '../../../src/services/skuMappingService';
import * as https from 'https';

// Mock the https module
jest.mock('https');

describe('SkuMappingService', () => {
  let skuMappingService: SkuMappingService;
  const mockHttpsGet = https.get as jest.MockedFunction<typeof https.get>;

  beforeEach(() => {
    jest.clearAllMocks();
    skuMappingService = new SkuMappingService();
  });

  describe('buildSkuFriendlyNameMap', () => {
    it('should successfully parse CSV and build mapping', async () => {
      const mockCsvContent = `Product_Display_Name,String_Id,GUID,Service_Plan_Name,Service_Plan_Id,Service_Plans_Included_Friendly_Names
Office 365 E3,ENTERPRISEPACK,6fd2c87f-b296-42f0-b197-1e91e994b900,MESH_AVATARS_FOR_TEAMS,dcf9d2f4-772e-4434-b757-77a453cfbc02,Avatars for Teams
Office 365 E3,ENTERPRISEPACK,6fd2c87f-b296-42f0-b197-1e91e994b900,EXCHANGE_S_ENTERPRISE,efb87545-963c-4e0d-99df-69c6916d9eb0,Exchange Online (Plan 2)
Microsoft 365 E5,SPE_E5,06ebc4ee-1bb5-47dd-8120-11324bc54e06,TEAMS1,57ff2da0-773e-42df-b2af-ffb7a2317929,Microsoft Teams`;

      mockHttpsGet.mockImplementation((url: any, callback: any) => {
        const mockResponse: any = {
          statusCode: 200,
          setEncoding: jest.fn(),
          on: jest.fn((event: string, handler: Function) => {
            if (event === 'data') {
              handler(mockCsvContent);
            } else if (event === 'end') {
              handler();
            }
          }),
        };

        callback(mockResponse);

        return {
          on: jest.fn(),
        } as any;
      });

      await skuMappingService.buildSkuFriendlyNameMap();

      expect(skuMappingService.getFriendlyNameByStringId('ENTERPRISEPACK')).toBe('Office 365 E3');
      expect(skuMappingService.getFriendlyNameByStringId('SPE_E5')).toBe('Microsoft 365 E5');
      expect(
        skuMappingService.getFriendlyNameByGuid('6fd2c87f-b296-42f0-b197-1e91e994b900')
      ).toBe('Office 365 E3');
    });

    it('should handle HTTP errors gracefully', async () => {
      mockHttpsGet.mockImplementation((url: any, callback: any) => {
        const mockResponse: any = {
          statusCode: 404,
          statusMessage: 'Not Found',
        };

        callback(mockResponse);

        return {
          on: jest.fn(),
        } as any;
      });

      await expect(skuMappingService.buildSkuFriendlyNameMap()).resolves.toBeUndefined();
      expect(skuMappingService.getFriendlyNameByStringId('ENTERPRISEPACK')).toBeUndefined();
    });

    it('should handle network errors gracefully', async () => {
      mockHttpsGet.mockImplementation(() => {
        return {
          on: jest.fn((event: string, handler: Function) => {
            if (event === 'error') {
              handler(new Error('Network error'));
            }
          }),
        } as any;
      });

      await expect(skuMappingService.buildSkuFriendlyNameMap()).resolves.toBeUndefined();
    });

    it('should handle CSV with quoted fields containing commas', async () => {
      const mockCsvContent = `Product_Display_Name,String_Id,GUID,Service_Plan_Name,Service_Plan_Id,Service_Plans_Included_Friendly_Names
"Office 365 E3, Extended",ENTERPRISEPACK_EXTENDED,test-guid-1,PLAN1,plan-id-1,Plan 1
Regular License,REGULAR_SKU,test-guid-2,PLAN2,plan-id-2,Plan 2`;

      mockHttpsGet.mockImplementation((url: any, callback: any) => {
        const mockResponse: any = {
          statusCode: 200,
          setEncoding: jest.fn(),
          on: jest.fn((event: string, handler: Function) => {
            if (event === 'data') {
              handler(mockCsvContent);
            } else if (event === 'end') {
              handler();
            }
          }),
        };

        callback(mockResponse);

        return {
          on: jest.fn(),
        } as any;
      });

      await skuMappingService.buildSkuFriendlyNameMap();

      expect(skuMappingService.getFriendlyNameByStringId('ENTERPRISEPACK_EXTENDED')).toBe(
        'Office 365 E3, Extended'
      );
      expect(skuMappingService.getFriendlyNameByStringId('REGULAR_SKU')).toBe('Regular License');
    });

    it('should only store the first occurrence of duplicate SKUs', async () => {
      const mockCsvContent = `Product_Display_Name,String_Id,GUID,Service_Plan_Name,Service_Plan_Id,Service_Plans_Included_Friendly_Names
Office 365 E3,ENTERPRISEPACK,6fd2c87f-b296-42f0-b197-1e91e994b900,PLAN1,plan-id-1,Plan 1
Office 365 E3,ENTERPRISEPACK,6fd2c87f-b296-42f0-b197-1e91e994b900,PLAN2,plan-id-2,Plan 2
Office 365 E3,ENTERPRISEPACK,6fd2c87f-b296-42f0-b197-1e91e994b900,PLAN3,plan-id-3,Plan 3`;

      mockHttpsGet.mockImplementation((url: any, callback: any) => {
        const mockResponse: any = {
          statusCode: 200,
          setEncoding: jest.fn(),
          on: jest.fn((event: string, handler: Function) => {
            if (event === 'data') {
              handler(mockCsvContent);
            } else if (event === 'end') {
              handler();
            }
          }),
        };

        callback(mockResponse);

        return {
          on: jest.fn(),
        } as any;
      });

      await skuMappingService.buildSkuFriendlyNameMap();

      // Should still be "Office 365 E3" (first occurrence)
      expect(skuMappingService.getFriendlyNameByStringId('ENTERPRISEPACK')).toBe('Office 365 E3');
    });

    it('should handle redirects', async () => {
      const mockCsvContent = `Product_Display_Name,String_Id,GUID,Service_Plan_Name,Service_Plan_Id,Service_Plans_Included_Friendly_Names
Office 365 E3,ENTERPRISEPACK,6fd2c87f-b296-42f0-b197-1e91e994b900,PLAN1,plan-id-1,Plan 1`;

      let callCount = 0;
      mockHttpsGet.mockImplementation((url: any, callback: any) => {
        callCount++;

        if (callCount === 1) {
          // First call: return redirect
          const mockResponse: any = {
            statusCode: 302,
            headers: {
              location: 'https://redirected-url.com/file.csv',
            },
          };
          callback(mockResponse);
        } else {
          // Second call: return actual content
          const mockResponse: any = {
            statusCode: 200,
            setEncoding: jest.fn(),
            on: jest.fn((event: string, handler: Function) => {
              if (event === 'data') {
                handler(mockCsvContent);
              } else if (event === 'end') {
                handler();
              }
            }),
          };
          callback(mockResponse);
        }

        return {
          on: jest.fn(),
        } as any;
      });

      await skuMappingService.buildSkuFriendlyNameMap();

      expect(skuMappingService.getFriendlyNameByStringId('ENTERPRISEPACK')).toBe('Office 365 E3');
      expect(mockHttpsGet).toHaveBeenCalledTimes(2);
    });
  });

  describe('getFriendlyNameByStringId', () => {
    it('should return undefined for non-existent SKU', () => {
      expect(skuMappingService.getFriendlyNameByStringId('NON_EXISTENT_SKU')).toBeUndefined();
    });
  });

  describe('getFriendlyNameByGuid', () => {
    it('should return undefined for non-existent GUID', () => {
      expect(
        skuMappingService.getFriendlyNameByGuid('00000000-0000-0000-0000-000000000000')
      ).toBeUndefined();
    });
  });
});
