# E-view (MVP) - Multi-tenant SaaS Platform

Multi-tenant e-commerce platform built with Next.js App Router, Azure AD authentication, Azure PostgreSQL, and Azure Blob Storage.

## Prerequisites
- Node 18+
- Azure PostgreSQL database
- Azure AD tenant for authentication
- Azure Storage Account for file uploads

## Environment
Create `.env` at project root:

```
# Azure AD (NextAuth)
AZURE_AD_CLIENT_ID=your_client_id
AZURE_AD_CLIENT_SECRET=your_client_secret
AZURE_AD_TENANT_ID=your_tenant_id
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# Azure PostgreSQL
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB?sslmode=require

# Azure Blob Storage
AZURE_STORAGE_ACCOUNT=eviewstorage
AZURE_STORAGE_CONNECTION_STRING=your_connection_string
AZURE_STORAGE_CONTAINER=uploads

# Optional
PLATFORM_BASE_DOMAIN=localhost
```

## Setup Instructions

### 1. Azure AD Authentication
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to Azure Active Directory > App registrations
3. Create a new registration
4. Set redirect URI: `http://localhost:3000/api/auth/callback/azure-ad`
5. Enable ID tokens in Authentication settings
6. Copy Client ID, Client Secret, and Tenant ID

### 2. Azure PostgreSQL
1. Create Azure Database for PostgreSQL Flexible Server
2. Configure firewall rules to allow your IP
3. Copy connection string to `DATABASE_URL`

### 3. Azure Blob Storage
1. Create Azure Storage Account
2. Create a container named "uploads"
3. Copy connection string to `AZURE_STORAGE_CONNECTION_STRING`

## Install & Run

```
npm install
npm run db:generate
npm run db:push
npm run dev
```

## Features

### Authentication & RBAC
- **Azure AD Integration**: Enterprise authentication
- **User Roles**: SUPER_ADMIN, OWNER, ADMIN, EDITOR, STAFF, VIEWER
- **Platform Admin**: Manage all merchants from central dashboard
- **Tenant Admin**: Individual merchant management

### File Uploads
- **Azure Blob Storage**: Production file storage
- **Local Storage**: Development fallback
- **SAS URLs**: Secure direct uploads
- **Image Management**: Product images and media

### Multi-tenant Architecture
- **Tenant Isolation**: Complete data separation
- **Custom Domains**: Support for custom merchant domains
- **Platform Management**: Centralized merchant management

## API Endpoints

### Platform Admin
- `GET /api/platform/tenants` - List all merchants
- `POST /api/platform/tenants` - Create new merchant
- `GET /api/platform/tenants/[slug]/status` - Get merchant status

### Tenant Admin
- `GET /api/admin/[tenantSlug]/products` - List products
- `POST /api/admin/[tenantSlug]/products` - Create product
- `PATCH /api/admin/[tenantSlug]/products/[id]` - Update product

### Storefront
- `GET /api/storefront/[tenantSlug]/products` - Public product listing
- `POST /api/storefront/[tenantSlug]/cart/add` - Add to cart
- `POST /api/storefront/[tenantSlug]/checkout` - Process checkout

## Testing

### Authentication Test
1. Visit `http://localhost:3000/test-auth`
2. Click "Sign in with Azure AD"
3. Complete Microsoft login
4. Verify session data is returned

### Platform Admin
1. Visit `http://localhost:3000/admin/platform/merchants`
2. Create new merchant
3. Verify merchant appears in list
4. Test Admin/Storefront quick links

### Merchant Storefront
1. Visit `http://localhost:3000/[merchant-slug]/retail`
2. Browse products and test cart functionality

## Phase 3 Status (Complete E-commerce Platform)

### **Customer Storefront** (`/`):
- ✅ **Product Browsing**: Grid layout with search and filtering
- ✅ **Product Details**: Variant selection, quantity, add to cart
- ✅ **Shopping Cart**: `/cart` page with item management
- ✅ **Checkout Flow**: Order creation and payment initiation
- ✅ **Social Media Integration**: Footer with merchant's social links
- ✅ **Store Customization**: Branding, store name, description

### **Admin Dashboard** (`/admin`):
- ✅ **Product Management**: CRUD operations, image uploads
- ✅ **Product Options & Variants**: Flexible configurations (Size, Color, etc.)
- ✅ **Store Settings**: `/admin/settings` - comprehensive merchant control center
  - Store information (name, description, contact)
  - Social media links (Instagram, Facebook, Twitter, WhatsApp, TikTok)
  - Branding (colors, logo, favicon)
  - Product categories management
- ✅ **Order Management**: View and manage customer orders
- ✅ **Team Management**: Invite and manage store staff

### **Technical Features**:
- ✅ **Multi-tenant Architecture**: Complete tenant isolation
- ✅ **Authentication & RBAC**: Clerk integration with role-based access
- ✅ **Payment Integration**: MyFatoorah, KNET, Stripe (stubbed)
- ✅ **File Uploads**: Cloudflare R2 integration for images
- ✅ **Database**: Postgres with RLS, Prisma ORM

### **Complete Platform Testing**:

#### **Customer Storefront Testing**:
1. **Visit**: `http://localhost:3000/acme/` (customer storefront)
2. **Browse products**: Search, filter, view product details
3. **Add to cart**: Select variants, quantities, add items
4. **Checkout**: Complete purchase flow
5. **View social links**: Check footer for merchant's social media

#### **Admin Dashboard Testing**:
1. **Visit**: `http://localhost:3000/acme/admin/products` (merchant admin)
2. **Manage products**: Create, edit, delete products
3. **Product variants**: Click "Options" to manage Size/Color variants
4. **Store settings**: Click "Settings" to customize store
   - Add store name, description, contact info
   - Configure social media links (Instagram, Facebook, etc.)
   - Set branding colors and logo
   - Manage product categories
5. **View storefront**: Click "View" on products to see customer experience

#### **Multi-tenant Testing**:
- **acme**: `http://localhost:3000/acme/` and `http://localhost:3000/acme/admin/products`
- **moka**: `http://localhost:3000/moka/` and `http://localhost:3000/moka/admin/products`
- Verify complete tenant isolation
