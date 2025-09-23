# Demo Tenant Purge Scripts

These scripts safely remove demo/mock tenants and their related data from the development database.

## ⚠️ Safety Features

- **Environment Guard**: Refuses to run in production
- **Dry Run by Default**: Shows what would be deleted without making changes
- **Whitelist Only**: Only deletes tenants matching specific patterns
- **Transaction Safety**: Uses database transactions for atomic operations

## 🎯 What Gets Deleted

### Tenant Patterns
Tenants with slugs matching these patterns are deleted:
- `demo`, `acme`, `moka`, `seed`, `sample`, `test`, `play`, `sandbox`
- Any slug starting with these prefixes (e.g., `demo-store`, `test-cafe`)

### Related Data
- Domains
- Memberships/Roles
- Pages/Content
- Hero slides
- Products & Product images
- Categories
- Orders & Order items
- Cart items & Carts
- Finally: The tenant itself

## 🚀 Usage

### Dry Run (Safe - Shows What Would Be Deleted)
```bash
CONFIRM_PURGE=NO npm run purge:demo
```

### Live Delete (Actually Deletes Data)
```bash
CONFIRM_PURGE=YES npm run purge:demo
```

### Storage Cleanup (Optional)
```bash
# Dry run
CONFIRM_PURGE=NO npm run purge:storage

# Live delete
CONFIRM_PURGE=YES npm run purge:storage
```

## 📋 Example Output

```
🧹 Demo Tenant Purge Script
==========================
✅ Environment check passed - running in development mode
🔍 Mode: DRY RUN (no changes)

📋 Scanning for demo/mock tenants...
🎯 Found 3 demo/mock tenants to purge:
   - demo-store (Demo Store) - active - Created: 2025-09-01
   - test-cafe (Test Cafe) - active - Created: 2025-09-05
   - acme (Acme Inc) - active - Created: 2025-09-01

📊 Total tenants in database: 3
🗑️  Tenants to delete: 3
✅ Tenants to keep: 0

🔍 DRY RUN COMPLETE - No data was deleted
   To actually delete, run: CONFIRM_PURGE=YES npm run purge:demo
```

## 🛡️ What's Protected

- **Platform admins**: Never deleted
- **Real tenants**: Only demo/mock patterns are targeted
- **Production**: Script refuses to run in production environment
- **Non-matching tenants**: Any tenant not matching the patterns is preserved

## 🎉 After Purge

You can now:
1. Create a new tenant from Platform Admin → Merchants
2. Test the complete merchant onboarding flow
3. Add custom domains and verify the setup
4. Validate the entire multi-tenant system with fresh data

## ⚠️ Important Notes

- **Development Only**: Never run in production
- **Irreversible**: Once deleted, data cannot be recovered
- **Backup**: Consider backing up your database before running
- **Storage**: Run storage cleanup separately if needed


