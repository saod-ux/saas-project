# Firebase Setup Guide

## Environment Variables

Add the following environment variables to your `.env` file:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin Configuration
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key_here\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com

# JWT Secret for customer authentication
JWT_SECRET=your_jwt_secret_key_here

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here
```

## Firebase Project Setup

1. Create a new Firebase project at https://console.firebase.google.com
2. Enable Authentication with Email/Password, Google, Apple, and Phone providers
3. Enable Firestore Database
4. Enable Firebase Storage
5. Generate a service account key for server-side operations
6. Update the environment variables with your project details

## Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Tenants collection - only platform admins can access
    match /tenants/{tenantId} {
      allow read, write: if request.auth != null && 
        request.auth.token.role == 'SUPER_ADMIN';
    }
    
    // Tenant-scoped collections
    match /{collection}/{document} {
      allow read, write: if request.auth != null && 
        resource.data.tenantId == request.auth.token.tenantId;
    }
    
    // Platform admins collection
    match /platformAdmins/{adminId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == adminId;
    }
  }
}
```

## Storage Security Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /tenants/{tenantId}/{allPaths=**} {
      allow read, write: if request.auth != null && 
        request.auth.token.tenantId == tenantId;
    }
  }
}
```

