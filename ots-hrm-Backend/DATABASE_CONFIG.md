# Database Configuration Guide

## Overview
HRM backend uses TypeORM with PostgreSQL. Configuration is centralized in `src/config/db-env.config.ts` using singleton pattern.

## Project Structure
```
src/
├── config/
│   └── db-env.config.ts    # 🎯 Main database configuration
├── dal/db/
│   └── db-source.ts        # TypeORM DataSource
└── utility/
    └── database-manager.ts # Connection utilities
```

## Environment Variables
Create `.env` file in root:
```env
DB_Server=your-postgres-host.com
DB_DataBase=your_database_name
DB_userId=your_username
DB_Password=your_password
DB_Port=5432
NODE_ENV=development|staging|production
PORT=8060
```

## Basic Configuration Access
```typescript
import { configManager, getTypeOrmConfig } from "./config/db-env.config";

// Get database configuration (with logging)
const dbConfig = configManager.getDatabaseConfig(true);

// Get database configuration (silent)
const dbConfig = configManager.getDatabaseConfig();

// Check if configuration is valid
const isValid = configManager.isConfigurationValid();

// Get TypeORM configuration
const typeormConfig = getTypeOrmConfig();
```

## Database Manager Usage
```typescript
import { dbManager } from "./utility/database-manager";

// Check connection status
const isConnected = await dbManager.isConnected();

// Wait for connection with timeout
const connected = await dbManager.waitForConnection(30000);

// Execute operation with connection verification
const result = await dbManager.executeWithConnection(async (dataSource) => {
    return dataSource.getRepository(User).find();
});

// Get connection information
const info = await dbManager.getConnectionInfo();
```

## Key Features
- ✅ **Singleton Pattern**: Single instance, no duplicate logging
- ✅ **Lazy Loading**: Config loaded only when needed
- ✅ **Auto Validation**: Environment variables checked automatically
- ✅ **SSL Support**: Environment-based SSL configuration
- ✅ **Health Monitoring**: `/health` endpoint for status checks

## Health Check Endpoint
```
GET /health
```
Response:
```json
{
  "status": "OK",
  "database": "Connected",
  "connectionInfo": {
    "isConnected": true,
    "database": "hrm_dev_gs9o",
    "host": "your-postgres-host.com",
    "port": 5432
  }
}
```

## Common Commands
```bash
npm run dev              # Start development
npm run build            # Build project
npm run migration:run    # Run migrations
npm run schema:sync      # Sync database schema
```

## Troubleshooting

### Quick Fixes
| Issue | Solution |
|-------|----------|
| Missing env variables | Check `.env` file has all `DB_*` variables |
| Connection timeout | Verify PostgreSQL server is running |
| Duplicate config logs | Normal behavior - logs only once |
| Database not initialized | Use `dbManager.waitForConnection(30000)` |

### Common Errors
- **"Missing required environment variables"**: Check `.env` file
- **"Database not initialized"**: Wait for connection to establish
- **"Invalid database configuration"**: Verify all DB_* variables are set

## Best Practices
1. Use `configManager.getDatabaseConfig()` for repeated access
2. Check `dbManager.isConnected()` before database operations
3. Monitor `/health` endpoint in production
4. Keep seeders idempotent (safe to run multiple times)
5. Use SSL in production environments
