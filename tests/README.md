# Testing Guide

This directory contains all test files for the entra_node project.

## Directory Structure

```
tests/
├── unit/               # Unit tests (fast, isolated, no external dependencies)
├── integration/        # Integration tests (slower, may require real API access)
├── __mocks__/         # Manual mocks for external dependencies
├── fixtures/          # Test data and fixtures
└── setup.ts           # Global test setup and configuration
```

## Writing Tests

### Unit Tests

Unit tests should:
- Test a single unit of code in isolation
- Use mocks for all external dependencies
- Run fast (< 100ms per test)
- Not require network access or real credentials
- Be placed in `tests/unit/` mirroring the `src/` structure

Example:
```typescript
// tests/unit/services/myService.test.ts
import { MyService } from '../../../src/services/myService';

describe('MyService', () => {
  it('should do something', () => {
    const service = new MyService();
    expect(service.doSomething()).toBe(expected);
  });
});
```

### Integration Tests

Integration tests should:
- Test multiple components working together
- May use real external services (with proper credentials)
- Be skipped by default using `describe.skip()`
- Only run in CI or when explicitly requested
- Be placed in `tests/integration/`

Example:
```typescript
// tests/integration/myService.integration.test.ts
describe.skip('MyService Integration', () => {
  it('should work with real API', async () => {
    // Test with real credentials
  });
});
```

## Best Practices

### 1. Test Organization
- Use `describe` blocks to group related tests
- Use `beforeEach` for common setup
- Use `afterEach` for cleanup
- Keep tests independent (no shared state)

### 2. Naming Conventions
- Test files: `*.test.ts` or `*.spec.ts`
- Test descriptions: Use "should" statements
- Be descriptive and specific

### 3. Mocking
- Mock external dependencies (APIs, databases, file system)
- Use `jest.mock()` for module mocks
- Use `jest.fn()` for function mocks
- Clear mocks in `beforeEach`

### 4. Assertions
- Use specific matchers (`toBe`, `toEqual`, `toHaveBeenCalledWith`)
- Test both success and failure cases
- Test edge cases (null, undefined, empty arrays)
- One logical assertion per test (when possible)

### 5. Async Testing
- Use `async/await` for promises
- Set appropriate timeouts for slow tests
- Test both resolved and rejected promises

### 6. Coverage
- Aim for 70%+ code coverage
- Focus on critical business logic
- Don't test third-party code
- Run `npm run test:coverage` to check

## Common Patterns

### Mocking Microsoft Graph Client
```typescript
jest.mock('@microsoft/microsoft-graph-client');

const mockApi = {
  get: jest.fn(),
  select: jest.fn().mockReturnThis(),
};

const mockClient = {
  api: jest.fn().mockReturnValue(mockApi),
};

(Client.initWithMiddleware as jest.Mock).mockReturnValue(mockClient);
```

### Mocking Azure Credentials
```typescript
jest.mock('@azure/identity');

const mockCredential = {
  getToken: jest.fn().mockResolvedValue({
    token: 'mock-token',
    expiresOnTimestamp: Date.now() + 3600000,
  }),
};
```

### Using Fixtures
```typescript
import { mockEntraUser, mockEntraUsers } from '../../fixtures/users.fixture';

it('should process user data', () => {
  const result = processUser(mockEntraUser);
  expect(result).toBeDefined();
});
```

## Running Tests

See main README or package.json scripts:
- `npm test` - Run all tests
- `npm run test:watch` - Run in watch mode
- `npm run test:coverage` - Run with coverage report
- `npm run test:unit` - Run only unit tests
- `npm run test:integration` - Run only integration tests (skipped by default)
- `npm run test:ci` - Run in CI mode with coverage

## Debugging Tests

### VS Code
Add this to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Current File",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["${fileBasename}", "--runInBand"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Command Line
```bash
# Run specific test file
npm test -- tests/unit/services/graphService.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="getUserById"

# Run in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```
