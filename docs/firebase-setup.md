# Firebase Setup Documentation

## Authorized Domains

For Firebase Authentication to work properly, ensure the following domains are added to your Firebase project's authorized domains:

### Required Domains
- `e-view-mfjmcjxud-e-view.vercel.app` (Vercel preview domain)
- `e-view.vercel.app` (Vercel production domain)
- `localhost` (for local development)
- `127.0.0.1` (for local development)

### How to Add Authorized Domains

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `e-view-7ebc8`
3. Navigate to **Authentication** → **Settings** → **Authorized domains**
4. Click **Add domain** and add each domain listed above
5. Save the changes

### Verification

After adding domains, test authentication on each domain:
- Local: `http://localhost:3000/sign-in`
- Preview: `https://e-view-mfjmcjxud-e-view.vercel.app/sign-in`
- Production: `https://e-view.vercel.app/sign-in`

## Environment Variables

### Client-Side (NEXT_PUBLIC_*)
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

### Server-Side (FIREBASE_*)
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

## Debug Endpoints

### Environment Variables Debug
- **Client**: `/debug-env` - Shows client-side environment variables
- **Server**: `/api/test-env` - Shows server-side environment variables

### Test User Creation
- **Page**: `/create-user` - Create test users for development
- **API**: `/api/auth/create-test-user` - API endpoint for user creation

**Note**: These debug endpoints should be removed or restricted in production.

## Security Notes

- Test user creation is restricted in production environments
- Custom claims are set for platform admin roles
- Email verification is automatically enabled for test users
- All sensitive data is properly masked in debug outputs
