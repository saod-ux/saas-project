const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

// Initialize Firebase Admin
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
};

const app = initializeApp({
  credential: cert(serviceAccount),
  projectId: process.env.FIREBASE_PROJECT_ID
});

const auth = getAuth(app);

async function createTestAdmin() {
  try {
    console.log('Creating test admin user...');
    
    // Create user
    const userRecord = await auth.createUser({
      email: 'admin@test.com',
      password: 'TestPassword123!',
      displayName: 'Test Admin',
      emailVerified: true
    });

    console.log('User created:', userRecord.uid);

    // Set custom claims for merchant admin
    await auth.setCustomUserClaims(userRecord.uid, {
      userType: 'merchant_admin',
      role: 'admin',
      tenantId: 'EP7BbCWm0JFvhjwBtcEs', // Use the existing demo store tenant ID
      tenantSlug: 'demo-store'
    });

    console.log('Custom claims set successfully');
    console.log('Test admin user created:');
    console.log('Email: admin@test.com');
    console.log('Password: TestPassword123!');
    console.log('User Type: merchant_admin');
    console.log('Tenant: demo-store');

  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      console.log('User already exists, updating custom claims...');
      
      // Get existing user
      const userRecord = await auth.getUserByEmail('admin@test.com');
      
      // Update custom claims
      await auth.setCustomUserClaims(userRecord.uid, {
        userType: 'merchant_admin',
        role: 'admin',
        tenantId: 'EP7BbCWm0JFvhjwBtcEs',
        tenantSlug: 'demo-store'
      });

      console.log('Custom claims updated successfully');
      console.log('Test admin user ready:');
      console.log('Email: admin@test.com');
      console.log('Password: TestPassword123!');
      console.log('User Type: merchant_admin');
      console.log('Tenant: demo-store');
    } else {
      console.error('Error creating test admin:', error);
    }
  }
}

createTestAdmin().then(() => {
  console.log('Done!');
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});
