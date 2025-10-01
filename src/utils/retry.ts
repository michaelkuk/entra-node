/**
 * Retry utility with exponential backoff
 */

export interface RetryOptions {
  maxRetries: number;
  retryDelayMs: number;
}

/**
 * Error with status code
 */
interface ErrorWithStatus extends Error {
  statusCode?: number;
}

/**
 * Check if error indicates throttling
 */
function isThrottlingError(error: ErrorWithStatus): boolean {
  return (
    error.statusCode === 429 ||
    error.message?.includes('throttled') ||
    error.message?.includes('Too Many Requests')
  );
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T> {
  const { maxRetries, retryDelayMs } = options;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      const err = error as ErrorWithStatus;
      const isThrottled = isThrottlingError(err);

      if (isThrottled && i < maxRetries - 1) {
        const delay = retryDelayMs * Math.pow(2, i);
        console.log(`⚠️  Throttled. Waiting ${delay}ms before retry ${i + 1}/${maxRetries}...`);
        await new Promise((resolve) => global.setTimeout(resolve, delay));
      } else if (i === maxRetries - 1) {
        throw error;
      } else {
        throw error;
      }
    }
  }

  // This should never be reached, but TypeScript requires it
  throw new Error('Retry logic failed unexpectedly');
}
