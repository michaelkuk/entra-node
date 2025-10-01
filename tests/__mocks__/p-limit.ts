/**
 * Mock for p-limit module
 */

// Mock pLimit function
const pLimit = (concurrency: number) => {
  return (fn: () => Promise<any>) => fn();
};

export default pLimit;
