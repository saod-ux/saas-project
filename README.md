# SaaS Platform (Phase 1)

Multi-tenant Shopify-style starter. Next.js App Router + Prisma + Postgres with RLS.

## Prerequisites
- Node 18+
- Postgres database (Neon recommended)

## Environment
Create `.env` at project root:

```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB?schema=public"
```

## Install

```
npm install
```

## Prisma

Generate client:
```
npm run db:generate
```

Create and run migrations:
```
# Create initial tables from prisma/schema.prisma
npx prisma migrate dev --name init

# Apply RLS policies
# Prisma won't run raw SQL migrations in order unless created; you can run manually too
psql "$DATABASE_URL" -f prisma/migrations/001_enable_rls/migration.sql
```

Seed demo data:
```
npm run db:seed
```

## Dev server

```
npm run dev
```

Open admin for a tenant:
- acme: `http://acme.localhost:3000/admin/products`
- moka: `http://moka.localhost:3000/admin/products`

## API v1
- GET `/api/v1/products?q=`
- POST `/api/v1/products`
- PATCH `/api/v1/products/:id`
- GET `/api/v1/settings`
- PATCH `/api/v1/settings`
- GET `/api/v1/orders`
- POST `/api/v1/orders`
- POST `/api/v1/webhooks/myfatoorah` (stub)

All requests are tenant-scoped via subdomain or custom domain. RLS blocks cross-tenant access using `set_config('app.tenant_id', ...)`.

## Notes
- Phase 2 will add auth + RBAC and presigned uploads.
- Use Prisma Studio to inspect data: `npm run db:studio`.

# SaaS Platform (Phase 2)

Multi-tenant Shopify-style starter with authentication, RBAC, and file uploads. Next.js App Router + Prisma + Postgres with RLS + Clerk + Cloudflare R2.

## Prerequisites
- Node 18+
- Postgres database (Neon for dev, AWS RDS for production)
- Clerk account for authentication
- Cloudflare R2 account for file storage

## Environment
Create `.env` at project root:

```
# Production (AWS RDS)
DATABASE_URL=postgresql://USER:PASSWORD@rds-proxy-endpoint:5432/DB?sslmode=require
READONLY_DATABASE_URL=postgresql://USER:PASSWORD@read-replica-endpoint:5432/DB?sslmode=require

# Development (local Postgres or Neon)
# DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/saas_platform
# READONLY_DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/saas_platform

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/admin/products
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/admin/products

# Cloudflare R2 Storage
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_BUCKET_NAME=your_bucket_name
R2_PUBLIC_URL=https://your-bucket.your-subdomain.r2.cloudflarestorage.com

ROOT_DOMAIN=localhost
```

## Setup Instructions

### 1. Clerk Authentication
1. Go to [clerk.com](https://clerk.com) and create an account
2. Create a new application
3. Copy your publishable key and secret key
4. Set the redirect URLs in Clerk dashboard:
   - Sign in: `http://localhost:3000/sign-in`
   - Sign up: `http://localhost:3000/sign-up`
   - After sign in: `http://localhost:3000/admin/products`
   - After sign up: `http://localhost:3000/admin/products`

### 2. Cloudflare R2 Storage
1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Navigate to R2 Object Storage
3. Create a new bucket
4. Create API tokens with R2 permissions
5. Copy account ID, access key, and secret key

### 3. Database Setup
1. Set your `DATABASE_URL` in `.env`
2. Run migrations: `npm run db:migrate`
3. Seed data: `npm run db:seed`

## Install & Run

```
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

## Phase 2 Features

### Authentication & RBAC
- **User Roles**: OWNER, ADMIN, STAFF, VIEWER
- **Team Management**: Invite members, assign roles
- **Permission System**: Role-based access control
- **Tenant Isolation**: Users can only access their tenant data

### File Uploads
- **Product Images**: Upload and attach to products
- **R2 Storage**: Cloudflare R2 integration
- **Presigned URLs**: Secure direct uploads
- **Image Management**: Organize and order product images

### API Security
- **Authentication Required**: All endpoints require valid session
- **Role Validation**: Endpoints check user permissions
- **Input Validation**: Zod schemas for all inputs
- **Error Handling**: Proper HTTP status codes (401, 403, 404, 422)

## API v1 (Phase 2)
- **Products**: `GET`, `POST`, `PATCH`, `DELETE` with auth
- **Orders**: `GET`, `POST` with auth
- **Settings**: `GET`, `PATCH` with auth
- **Invites**: `GET`, `POST` for team management
- **Uploads**: `POST /presign` for file uploads, `POST /attach` for linking

## Testing Flows

### 1. Authentication Flow
1. Visit `/admin/products` when signed out → redirected to login
2. Sign in with Clerk → redirected to admin dashboard
3. Non-member access → 403 Forbidden

### 2. Team Management
1. Admin creates invitation → logs accept URL in dev console
2. User accepts invitation → membership created and activated
3. User can now access tenant resources

### 3. File Uploads
1. Generate presigned URL via `POST /uploads/presign`
2. Upload file directly to R2
3. Attach file to product via `POST /uploads/attach`
4. Image appears in product management UI

## Development Notes

- **RLS**: Applied via Prisma migrations (no external psql required)
- **Read-Only Path**: Read endpoints use `prismaRO` when `READONLY_DATABASE_URL` is set
- **Stub Implementation**: R2 integration is stubbed for development
- **Error Mapping**: Clear error responses with proper HTTP status codes

## Production Setup (AWS)

### 1. Create RDS Postgres Instance
- Engine: PostgreSQL 15+
- Multi-AZ: Enabled for high availability
- Instance: db.t3.micro (dev) or db.r6g.large (prod)
- Storage: 20GB+ with auto-scaling
- Security Group: Allow inbound from your app servers

### 2. Create RDS Proxy
- Target: Your RDS instance
- IAM Authentication: Enabled
- Secrets Manager: Store database credentials
- Connection pooling: Enabled (min: 1, max: 100)

### 3. Create Read Replica (Optional)
- Source: Your RDS instance
- Multi-AZ: Enabled
- Use for read-heavy operations

### 4. Secrets Manager
- Store DATABASE_URL and READONLY_DATABASE_URL
- Rotate credentials automatically
- Use IAM roles for app access

## Next Steps (Phase 3)
- Cart and checkout flow
- Payment integration (per-tenant API keys)
- Order lifecycle management
- Webhook handling

Open admin for a tenant:
- acme: `http://acme.localhost:3000/admin/products`
- moka: `http://moka.localhost:3000/admin/products`

If these domains do not resolve locally, add to your hosts file and retry:

macOS/Linux: edit `/etc/hosts`
```
127.0.0.1 acme.localhost moka.localhost
```
Windows: edit `C:\\Windows\\System32\\drivers\\etc\\hosts` with the same line above.
