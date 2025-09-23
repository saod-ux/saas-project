# Database Configuration: Azure PostgreSQL

## Overview
Configured Azure PostgreSQL Flexible Server for the E-view MVP platform.

## Database Details
- **Provider**: Azure PostgreSQL Flexible Server
- **Server**: e-view-pg.postgres.database.azure.com
- **Database**: eview_db
- **User**: eview_admin
- **SSL**: Required (sslmode=require)

## Environment Changes
Updated `.env` with new DATABASE_URL:
```
DATABASE_URL="postgresql://eview_admin:biwSuq-8wavbe-gugqyd@e-view-pg.postgres.database.azure.com:5432/eview_db?sslmode=require"
```

## Prisma Migration
- Generated new Prisma client: `npx prisma generate`
- Applied migration: `npx prisma migrate dev --name switch_to_azure`
- Migration file: `prisma/migrations/20250913071001_switch_to_azure/migration.sql`

## Health Endpoints
- `GET /api/db/health` - Returns `{"ok":true}` on successful connection
- `GET /api/db/version` - Returns `{"ok":true,"version":"17.5"}` with PostgreSQL version

## Development Setup
- Default dev server: `npm run dev` (port 3000)
- Alternative port: `npm run dev:3001` (port 3001)
- Health check: `npm run db:health`

## Azure PostgreSQL Configuration
### Firewall Rules
1. Go to Azure Portal → PostgreSQL Flexible Server → Networking
2. Add current client IP to firewall rules
3. Ensure "Allow access to Azure services" is enabled

### Connection String Format
```
postgresql://username:password@server.postgres.database.azure.com:5432/database?sslmode=require
```

### Password Rotation
To rotate the database password:
1. Update password in Azure Portal
2. Update `DATABASE_URL` in `.env`
3. Restart the application

## Testing
- ✅ Prisma client generation successful
- ✅ Database migration applied successfully
- ✅ Health endpoint returns `{"ok":true}`
- ✅ Version endpoint returns PostgreSQL version
- ✅ Development server starts on port 3001
- ✅ No Neon references remain in codebase

## Files Changed
- `.env` - Updated DATABASE_URL
- `package.json` - Added dev:3001 script, updated db:health default port
- `README.md` - Updated database references from Neon to Azure PostgreSQL
- `prisma/migrations/` - Added new migration for Azure PostgreSQL

## Next Steps
- Monitor database performance and connection stability
- Consider setting up read replicas if needed
- Update production environment variables
- Test all application features with new database
