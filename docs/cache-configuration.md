# Cache Configuration Guide

## Overview
This document outlines the cache configuration setup for the Eliza application, specifically focusing on the SQLite database cache implementation.

## Current Working Configuration

### Environment Variables
The application uses the following environment variables in `agent/.env`:
```
CACHE_STORE=database
```

### Database Configuration
- SQLite database location: `/Users/michaelwitmore/Documents/eliza/agent/data/db.sqlite`
- Cache table schema:
```sql
CREATE TABLE IF NOT EXISTS "cache" (
    "key" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "value" TEXT DEFAULT '{}' CHECK(json_valid("value")),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP,
    PRIMARY KEY ("key", "agentId")
);
```

### Character Configuration
- Character file: `characters/LadyMacbethCopy.character.json`
- Required plugin: `@elizaos-plugins/adapter-sqlite`

## Troubleshooting Steps

### Common Issues
1. **Invalid Cache Store Error**
   - Error message: "Invalid cache store: DATABASE or required configuration missing"
   - Solution: Ensure `CACHE_STORE=database` is set in `agent/.env`
   - Note: The value must be lowercase to match the `CacheStore` enum

2. **Database Connection**
   - Verify SQLite database exists at the correct location
   - Check that the cache table schema is properly created

### Verification Steps
1. Check environment variables:
   ```bash
   cat agent/.env
   ```

2. Verify database connection:
   ```bash
   sqlite3 agent/data/db.sqlite ".tables"
   ```

3. Start the application with debug logging:
   ```bash
   pnpm start:debug
   ```

## Implementation Details

### Cache Store Types
The application supports three cache store types (defined in `CacheStore` enum):
- `database`: Uses SQLite database for caching
- `filesystem`: Uses file system for caching
- `redis`: Uses Redis for caching (currently commented out)

### SQLite Adapter Implementation
The SQLite adapter implements `IDatabaseCacheAdapter` with the following methods:
- `getCache`: Retrieves cache entries
- `setCache`: Stores cache entries
- `deleteCache`: Removes cache entries

## Starting the Application

1. Start the agent:
   ```bash
   pnpm start:debug
   ```

2. Start the client:
   ```bash
   pnpm start:client
   ```

3. Access the application:
   - REST API: http://localhost:3000 (or 3001 if 3000 is in use)
   - Client UI: http://localhost:5173 