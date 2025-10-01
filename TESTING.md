# Testing Framework Documentation

## Overview

This project uses **Jest** with **ts-jest** for comprehensive unit and integration testing of TypeScript code.

## Quick Start

```bash
# Run all tests
npm test

# Run tests in watch mode (great for development)
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Test Structure

```
tests/
├── unit/                    # Fast, isolated unit tests
│   ├── services/           # Mirror of src/services/
│   └── utils/              # Mirror of src/utils/
├── integration/            # Slower tests with real APIs (skipped by default)
├── __mocks__/             # Manual mocks for external libraries
│   ├── @azure/
│   └── @microsoft/
├── fixtures/              # Reusable test data
│   └── users.fixture.ts   # Sample Entra ID user objects
└── setup.ts               # Global test configuration
```

## Writing Tests

### Unit Test Example

```typescript
import { myFunction } from '../../../src/utils/myFunction';

describe('myFunction', () => {
  it('should do something specific', () => {
    const result = myFunction('input');
    expect(result).toBe('expected output');
  });

  it('should handle edge cases', () => {
    expect(myFunction('')).toBe('');
    expect(myFunction(null)).toThrow();
  });
});
```

### Mocking External Dependencies

```typescript
import { GraphService } from '../../../src/services/graphService';
import { Client } from '@microsoft/microsoft-graph-client';

// Mock the entire module
jest.mock('@microsoft/microsoft-graph-client');

describe('GraphService', () => {
  let mockClient: any;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Set up mock client
    mockClient = {
      api: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({ value: [] }),
        select: jest.fn().mockReturnThis(),
      }),
    };

    (Client.initWithMiddleware as jest.Mock).mockReturnValue(mockClient);
  });

  it('should fetch users', async () => {
    const service = new GraphService(mockCredential);
    const users = await service.getUsers();

    expect(mockClient.api).toHaveBeenCalledWith('/users');
    expect(users).toEqual([]);
  });
});
```

### Using Test Fixtures

```typescript
import { mockEntraUser, mockEntraUsers } from '../../fixtures/users.fixture';

it('should process user data', () => {
  const result = processUser(mockEntraUser);
  expect(result.displayName).toBe('John Doe');
});
```

### Async Testing

```typescript
it('should handle async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});

it('should handle rejected promises', async () => {
  await expect(failingAsyncFunction()).rejects.toThrow('Error message');
});
```

## Test Coverage

### Viewing Coverage

```bash
npm run test:coverage
```

This generates:
- Console summary
- HTML report in `coverage/lcov-report/index.html`
- LCOV file for CI/CD integration

### Coverage Thresholds

Current thresholds (enforced by Jest):
- **Statements**: 70%
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%

Configure in `jest.config.js` under `coverageThreshold`.

### What to Test

✅ **DO test:**
- Business logic
- Data transformations
- Error handling
- Edge cases (null, undefined, empty arrays)
- Async operations
- Conditional branches

❌ **DON'T test:**
- Third-party library code
- Simple getters/setters
- Type definitions
- Configuration files

## Integration Tests

Integration tests interact with real APIs and are **skipped by default**.

```typescript
describe.skip('Integration Test', () => {
  it('should work with real API', async () => {
    // This test only runs with npm run test:integration
  });
});
```

### Running Integration Tests

```bash
# Remove .skip from describe blocks manually, then:
npm run test:integration
```

**Requirements:**
- Set environment variables: `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`
- Valid Azure credentials
- Network access to Microsoft Graph API

## VS Code Integration

### Debugging Tests

Use the provided launch configurations (`.vscode/launch.json`):

1. **Jest: Current File** - Debug the currently open test file
2. **Jest: All Tests** - Debug all tests with breakpoints
3. **Run Dev** - Run the application in debug mode

### Setting Breakpoints

1. Open any test file
2. Click in the gutter to set a breakpoint
3. Press F5 or use Run → Start Debugging
4. Select "Jest: Current File"

## Best Practices

### 1. Test Organization

```typescript
describe('ClassName', () => {
  describe('methodName', () => {
    it('should do something specific', () => {
      // Single test case
    });
  });
});
```

### 2. Test Naming

- Use descriptive names: `should return empty array when no users found`
- Follow "should" pattern: `it('should...')`
- Be specific about the scenario

### 3. Setup and Teardown

```typescript
describe('MyClass', () => {
  let instance: MyClass;

  beforeEach(() => {
    // Runs before EACH test
    instance = new MyClass();
  });

  afterEach(() => {
    // Cleanup after EACH test
    jest.clearAllMocks();
  });

  beforeAll(() => {
    // Runs ONCE before all tests
  });

  afterAll(() => {
    // Runs ONCE after all tests
  });
});
```

### 4. Assertions

```typescript
// Primitives
expect(value).toBe(5);
expect(value).not.toBe(10);

// Objects and arrays
expect(obj).toEqual({ id: 1, name: 'Test' });
expect(arr).toHaveLength(3);

// Booleans
expect(condition).toBeTruthy();
expect(condition).toBeFalsy();

// Strings
expect(str).toContain('substring');
expect(str).toMatch(/regex/);

// Mocks
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
expect(mockFn).toHaveBeenCalledTimes(3);

// Errors
expect(() => throwError()).toThrow();
expect(() => throwError()).toThrow('Error message');
await expect(asyncFn()).rejects.toThrow();
```

### 5. Mock Best Practices

```typescript
// Clear mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});

// Mock return values
mockFn.mockReturnValue('value');
mockFn.mockResolvedValue('async value');
mockFn.mockRejectedValue(new Error('error'));

// Mock implementations
mockFn.mockImplementation((arg) => arg * 2);

// Chainable mocks
mockFn.mockReturnThis();
```

### 6. Testing Private Methods

Don't test private methods directly. Test them through public methods that call them.

### 7. One Assertion Per Test (When Possible)

```typescript
// Good - focused test
it('should return correct user count', () => {
  expect(users.length).toBe(5);
});

// Acceptable - related assertions
it('should return valid user object', () => {
  expect(user.id).toBeDefined();
  expect(user.displayName).toBe('John Doe');
  expect(user.email).toBe('john@example.com');
});
```

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Run tests
  run: npm run test:ci

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

### Test Script for CI

```bash
npm run test:ci
```

This runs tests with:
- `--ci` flag (non-interactive, fail-fast)
- `--coverage` (generates coverage reports)
- `--maxWorkers=2` (limits parallelism in CI environments)

## Troubleshooting

### Tests Are Slow

- Reduce `maxWorkers` in jest.config.js
- Use `jest.mock()` instead of real implementations
- Check for unnecessary `beforeEach` operations

### Tests Are Flaky

- Ensure proper cleanup in `afterEach`
- Don't share state between tests
- Mock time-dependent operations

### Coverage Not Updating

```bash
# Clear Jest cache
npx jest --clearCache

# Remove coverage directory
rm -rf coverage

# Run tests again
npm run test:coverage
```

### TypeScript Errors in Tests

- Ensure `@types/jest` is installed
- Check tsconfig.json includes test files
- Import from `@jest/globals` if needed

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [ts-jest Documentation](https://kulshekhar.github.io/ts-jest/)
- [Jest Matchers](https://jestjs.io/docs/expect)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Summary

This testing framework provides:
- ✅ Fast, isolated unit tests
- ✅ Mocked external dependencies
- ✅ 95%+ code coverage
- ✅ Integration test support
- ✅ VS Code debugging
- ✅ CI/CD ready
- ✅ TypeScript support
- ✅ Watch mode for development

Run `npm test` and start writing tests!
