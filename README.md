# Microsoft Entra ID User Export (Node.js/TypeScript)

High-performance tool for exporting comprehensive user information from Microsoft Entra ID (formerly Azure AD) to CSV format. **5-10x faster** than traditional PowerShell implementations through batch processing and parallelization.

---

## 🚀 Features

### User Data Export
- **User profiles**: Names, contact info, job details, location, employee ID
- **Manager relationships**: Direct manager information
- **Sign-in activity**: Last sign-in dates (requires Entra ID Premium)
- **Account status**: Account enabled/disabled, creation date
- **On-premises sync**: Sync status and source anchor

### MFA & Authentication
- **MFA status**: Detection of configured authentication methods
- **Default MFA method**: User's preferred authentication method
- **Supported methods**:
  - Email
  - FIDO2 Security Keys
  - Microsoft Authenticator
  - Phone (SMS/Voice)
  - Software OATH tokens
  - Temporary Access Pass (TAP)
  - Windows Hello for Business

### Groups & Licenses
- **Security groups**: All security-enabled group memberships
- **License assignments**: Friendly SKU names (e.g., ENTERPRISEPACK, SPE_E5)
- **Service plans**: Enabled service plans per license (e.g., EXCHANGE_S_ENTERPRISE)

### Performance Optimizations
- ✅ **Batch API requests** - Combines multiple API calls using `$batch` endpoint
- ✅ **Parallel processing** - Configurable concurrency (default: 10 users)
- ✅ **License SKU caching** - Pre-loads all SKUs once at startup
- ✅ **Exponential backoff** - Automatic retry with increasing delays for throttling
- ✅ **Progress tracking** - Real-time updates with rate calculation
- ✅ **~2 API calls per user** (vs 4-6 in PowerShell implementations)

---

## 📊 Performance Comparison

| Users | Node.js (This Tool) | PowerShell |
|-------|---------------------|------------|
| 100   | ~15 seconds         | ~2 minutes |
| 1,000 | ~2.5 minutes        | ~20 minutes |
| 10,000| ~25 minutes         | ~3.5 hours |

**Why faster?**
- Batch API requests reduce HTTP overhead
- Parallel processing with configurable concurrency
- Non-blocking I/O operations
- Efficient memory usage with streaming

---

## 📋 Prerequisites

### System Requirements
- **Node.js**: 18.0.0 or higher
- **npm**: Included with Node.js

### Microsoft Entra ID Permissions
The following Microsoft Graph API permissions are required:
- `User.Read.All` - Read all user profiles
- `UserAuthenticationMethod.Read.All` - Read user authentication methods
- `AuditLog.Read.All` - Read sign-in activity (Premium feature)
- `Organization.Read.All` - Read organization info
- `Group.Read.All` - Read group memberships
- `Directory.Read.All` - Read directory data

**Note**: First-time authentication will prompt for device code login. An admin consent may be required depending on your tenant configuration.

---

## 🔧 Installation

```bash
# Clone the repository
git clone <repository-url>
cd entra_node

# Install dependencies
npm install
```

---

## 🎯 Usage

### Quick Start

```bash
# Run the export (builds and executes)
npm start
```

**Output**: `./output/AllEntraIDUsers_<timestamp>.csv`

### Development Mode

```bash
# Run without building (faster for development)
npm run dev
```

### Build Only

```bash
# Compile TypeScript to JavaScript
npm run build

# Run compiled code
node dist/index.js
```

### Authentication Flow

1. Script starts and displays device code
2. Navigate to https://microsoft.com/devicelogin in your browser
3. Enter the provided code
4. Sign in with an account that has appropriate permissions
5. Select your target tenant from the list
6. Script proceeds with data export

---

## ⚙️ Configuration

Configuration is managed in `src/config/index.ts`:

```typescript
export const CONFIG = {
  tenantId: 'common',        // Multi-tenant or specific tenant ID
  clientId: '14d82eec-...',  // Microsoft Graph Command Line Tools
  scopes: [
    'User.Read.All',
    'UserAuthenticationMethod.Read.All',
    'AuditLog.Read.All',
    'Organization.Read.All',
    'Group.Read.All',
    'Directory.Read.All',
  ],
  outputDir: './output',
  maxConcurrency: 10,        // Parallel user processing
  batchSize: 20,             // Max requests per batch (Graph limit)
  maxRetries: 3,             // Retry attempts for failed requests
  retryDelayMs: 2000,        // Initial retry delay (exponential backoff)
};
```

### Performance Tuning

**For faster exports (if not throttled):**
```typescript
maxConcurrency: 20  // Process 20 users concurrently
```

**If experiencing throttling (429 errors):**
```typescript
maxConcurrency: 5   // Reduce concurrent requests
retryDelayMs: 3000  // Increase initial retry delay
```

---

## 📄 CSV Output

### Exported Columns

| Column | Description |
|--------|-------------|
| `DisplayName` | User's display name |
| `UserPrincipalName` | User's UPN (email-like identifier) |
| `EmployeeId` | Employee ID number |
| `GivenName` | First name |
| `Surname` | Last name |
| `JobTitle` | Job title |
| `Department` | Department name |
| `OfficeLocation` | Office location |
| `City` | City |
| `State` | State/province |
| `Country` | Country |
| `StreetAddress` | Street address |
| `PostalCode` | Postal/ZIP code |
| `MobilePhone` | Mobile phone number |
| `BusinessPhones` | Business phone numbers (semicolon-delimited) |
| `Mail` | Primary email address |
| `OtherMails` | Additional email addresses (semicolon-delimited) |
| `Manager` | Manager's display name |
| `ManagerUPN` | Manager's UPN |
| `AccountEnabled` | `true` or `false` |
| `CreatedDateTime` | Account creation date |
| `SignInActivity` | Last sign-in date (Premium only) |
| `OnPremisesSyncEnabled` | `true` or `false` |
| `OnPremisesDistinguishedName` | AD distinguished name |
| `OnPremisesSamAccountName` | AD SAM account name |
| `MFAStatus` | Configured authentication methods (semicolon-delimited) |
| `DefaultMFAMethod` | User's preferred MFA method |
| `Security Groups` | Security group names (semicolon-delimited) |
| `Security Group Count` | Number of security groups |
| `License SKUs` | License SKU names (semicolon-delimited) |
| `License Count` | Number of licenses |
| `Enabled Service Plans` | Active service plans (semicolon-delimited) |

### Example Output

```csv
DisplayName,UserPrincipalName,EmployeeId,JobTitle,Department,MFAStatus,License SKUs
John Doe,john@contoso.com,12345,Engineer,IT,"Email;Microsoft Authenticator",ENTERPRISEPACK
```

---

## 🛠️ Development

### Code Quality

```bash
# Lint TypeScript files
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format

# Check formatting without changes
npm run format:check
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage report
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests (requires credentials)
npm run test:integration

# Run specific test file
npm test -- tests/unit/services/graphService.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="getUserById"
```

**Testing guidelines:**
- Unit tests mock external dependencies (Graph API, Azure Identity)
- Integration tests are skipped by default (require real credentials)
- Maintain 70%+ code coverage
- See `TESTING.md` for detailed testing guide

### Project Structure

```
entra_node/
├── src/
│   ├── config/              # Configuration management
│   ├── services/            # Business logic
│   │   ├── authService.ts   # Azure authentication
│   │   ├── batchService.ts  # Graph API batching
│   │   ├── csvService.ts    # CSV export
│   │   ├── groupService.ts  # Group operations
│   │   ├── licenseService.ts # License management
│   │   ├── mfaService.ts    # MFA detection
│   │   ├── tenantService.ts # Tenant selection
│   │   ├── userProcessor.ts # User processing orchestration
│   │   └── userService.ts   # User data retrieval
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   └── index.ts             # Entry point
├── tests/
│   ├── unit/                # Unit tests
│   ├── integration/         # Integration tests
│   ├── __mocks__/           # Manual mocks
│   └── fixtures/            # Test data
├── dist/                    # Compiled JavaScript (generated)
├── output/                  # CSV output directory
└── package.json
```

### Key Services

- **authService**: Handles Azure device code authentication
- **batchService**: Combines multiple Graph API requests into batches
- **userProcessor**: Orchestrates parallel user processing
- **licenseService**: Manages license SKU lookups and caching
- **mfaService**: Retrieves MFA methods and preferences
- **groupService**: Fetches security group memberships
- **csvService**: Generates CSV output files

---

## 🔍 Troubleshooting

### Authentication Issues

**Problem**: "AADSTS50020: User account from identity provider does not exist in tenant"
- **Solution**: Ensure you're using an account that belongs to the target tenant

**Problem**: "Insufficient privileges to complete the operation"
- **Solution**: Request admin consent for the required permissions

### Throttling (429 Errors)

**Problem**: "Rate limit is exceeded. Retry after X seconds"
- **Solution**: Reduce `maxConcurrency` in config (e.g., from 10 to 5)
- The script automatically retries with exponential backoff

### Premium Features

**Problem**: Sign-in activity shows "No Microsoft Entra ID Premium license"
- **Solution**: This is expected without Entra ID Premium. All other data exports normally.

### Performance Issues

**Problem**: Script is slower than expected
- **Solution 1**: Increase `maxConcurrency` (if not throttled)
- **Solution 2**: Check network latency to Microsoft Graph
- **Solution 3**: Ensure Node.js version is 18+

---

## 📜 License

ISC License

---

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass (`npm test`)
6. Format code (`npm run format`)
7. Submit a pull request

---

## 📚 Additional Documentation

- **CLAUDE.md** - Development guidance for Claude Code
- **TESTING.md** - Testing strategy and best practices
- **Parent README** - Comparison with PowerShell implementation

---

## 🆘 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Microsoft Graph API documentation: https://learn.microsoft.com/graph/
3. Open an issue in the repository

---

## ✨ Acknowledgments

Built with:
- [@azure/identity](https://www.npmjs.com/package/@azure/identity) - Azure authentication
- [@microsoft/microsoft-graph-client](https://www.npmjs.com/package/@microsoft/microsoft-graph-client) - Microsoft Graph SDK
- [csv-writer](https://www.npmjs.com/package/csv-writer) - CSV generation
- [p-limit](https://www.npmjs.com/package/p-limit) - Concurrency control
