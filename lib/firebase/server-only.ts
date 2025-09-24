// Server-only Firebase configuration
// This file should NEVER be imported by client-side code

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { getStorageBucket } from '@/lib/config/storage';

let serverAuth: any = null;
let serverDb: any = null;
let serverStorage: any = null;
let serverApp: any = null;

// Only initialize on server side
if (typeof window === 'undefined') {
  try {
    // Use environment variables for Firebase Admin SDK configuration
    const projectId = process.env.FIREBASE_PROJECT_ID || 'e-view-7ebc8';
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || 'firebase-adminsdk-fbsvc@e-view-7ebc8.iam.gserviceaccount.com';
    const privateKey = process.env.FIREBASE_PRIVATE_KEY || `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC3N0r9+9FMmy5/
20h0C1KlsOLVS1/++rWJ227pOFw24GvO+D7jU0BAVu0fvUFrA/jp+fFH99jlvaGS
aqF2TEJ2ueUpEvzCtjlBEIAOKqNcFE0Ff+Osrt2xafXdHMEyMbk+WXd4/tmmy6w8
iiS0wLgDRy4bSbcsgbB7yq04C9o8mdFHdS0To7/4HZhTpg2SO94f8H07NsWO3Upz
1oTp3lGa+MIIlkLa3M9tnwcRQ1g6aL/aDgSiV3aD9UQEAF6YCCfi/1lggw89GAD5
bY2cuU+b4QPHOeN0JpwIM8oKf0tJtlU87X4XxfhQRLGpw3WNFZWvyI8OhrQcdHH1
nKROOhfHAgMBAAECggEAAds1j0012ajY18LJASP8OmGIatDQsCyqGjN29DX1+Thc
30P0nykAxaYb0O6B8yufIf++ShRgxjMdp/YcnK45HirT/46JsQ9XlSktovcboJs0
DJI3JFDBPkLsksjvzCpkzhTp+PfcDKyTmilsJciuFJpsBSrCCFloCFkNWDwGggao
jK7dOAYz33L1H0m8rPlj00eyDsBYqr0FNXOGpXIVnLjpHOf6u0WBjnMdSWcYKbOh
WsIdRoF4fARGzmkTSZck3MnJSZvCnQQLxYFDNfj50j1DjDx2LTIOnf0ACBZWgLFU
0nt3g+3MkeFAB0R3udc+mU8LnpmPSW+M/hJpkIHEQQKBgQDZhMiRdRPKUw1YrNON
EC2AgI9eE+wWTd/OQHRA3+zAdz39KjNrG5TpPNhLacfkcAkKnDIdTFohdcmXNksg
3LxqqarQJC9cvDp1lTao0CzLPuuJI4Esahf+VAbFggvTp4bHQV4XbJr46lggSWVK
4y9bqMkrKAuANO8OlxWKzFJrwwKBgQDXoPj7qZSgME9B3se4heLgctdaWsxzdlDI
WzJrwrjetUNQgW9R3ghZ3shgd4cvoNCmcPSQvEGTtfk8uz9ht0YqvnpKPXcU5ypZ
cbH9xMQdVySY55LF0nLt4Qvaeahx1q74dtJ8ffAz9KTkdDmK7ibUB+fmWbBzhUU5
GubasfhXrQKBgQDOCcbqcVnjpjPYMSzaS96uABjNZlWU8wLyHX+BDBr4XHrtWZIG
/MNbAvVmybY8nhsSX83gjrg5RZdEknsrj6sx5bEVI5FxaCJ/ym1SDo6/nsQAzQ7I
gV5k3Dbl0z9cpy01hKeZzJgm++OqAZvfCb+MNR8IsA/kyz8+NMKFDPFtfQKBgAmZ
yzw5UrrHK+A88RuQKoff1SLaxBun+vTQyq/tnZmc7IBbIv+8KRcHSlixOb2vJVsj
0F/ZYfoXsh84HxxUsrUYgg1oKzMtD7+nxksMRccgqCp+tRRFyIQ67vItVIitDGFX
uQt9+AH4NJdPbXh4HhZ2u6aP+8FI/8oJHppCLlKJAoGAVp5mPfbZDtC5zbIH1tVF
p9lEhd5lm8+xjHYdhdHxvIfxQyRMdvHuYpxyZsUN2vZF2KLAips+Zm4OGBwh/NNp
on1XOZklDBYg2sKMkpuAJjxrMVntxqfjiI4z1RrCYoi4GZZOUDKG6A4yZDCycy00
YwTTb9HdpzoGpdLDqcDY5K0=
-----END PRIVATE KEY-----`;

    const serviceAccount = {
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n'),
    };

// Use centralized bucket configuration
const storageBucket = getStorageBucket(false);

    serverApp = getApps().length === 0 ? initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.projectId,
      storageBucket: storageBucket,
    }) : getApps()[0];

    // Initialize server-only instances
    serverAuth = getAuth(serverApp);
    serverDb = getFirestore(serverApp);
    serverStorage = getStorage(serverApp);
    
    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    // Keep null values for error cases
  }
}

// Export server-only instances
export { serverAuth, serverDb, serverStorage, serverApp };
