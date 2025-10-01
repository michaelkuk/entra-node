/**
 * Batch request service for Microsoft Graph API
 */

import { Client } from '@microsoft/microsoft-graph-client';
import { BatchRequest, BatchResponse } from '../types';
import { retryWithBackoff, RetryOptions } from '../utils/retry';

/**
 * BatchService handles Graph API batch requests
 */
export class BatchService {
  private client: Client;
  private retryOptions: RetryOptions;

  constructor(client: Client, retryOptions: RetryOptions) {
    this.client = client;
    this.retryOptions = retryOptions;
  }

  /**
   * Create batch request for multiple API calls
   */
  createBatchRequest(urls: string[]): BatchRequest {
    return {
      requests: urls.map((url, index) => ({
        id: String(index + 1),
        method: 'GET',
        url,
      })),
    };
  }

  /**
   * Execute batch request with retry logic
   */
  async executeBatch(batchRequest: BatchRequest): Promise<BatchResponse> {
    try {
      return await retryWithBackoff(
        () => this.client.api('/$batch').post(batchRequest),
        this.retryOptions
      );
    } catch (error) {
      const err = error as Error;
      console.error('⚠️  Batch request failed:', err.message);
      return { responses: [] };
    }
  }
}
