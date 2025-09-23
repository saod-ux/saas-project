# Phone Authentication Setup Guide

This guide explains how to enable phone number authentication in your Firebase project.

## 1. Enable Phone Authentication in Firebase Console

1. **Go to Firebase Console**: https://console.firebase.google.com
2. **Select your project**
3. **Navigate to Authentication** → **Sign-in method**
4. **Find "Phone" in the list** and click on it
5. **Toggle "Enable"** to turn on phone authentication
6. **Add your domain** to the authorized domains list:
   - For development: `localhost`
   - For production: your actual domain (e.g., `yourdomain.com`)

## 2. Configure reCAPTCHA (Required for Phone Auth)

Phone authentication requires reCAPTCHA verification. Firebase will automatically handle this, but you need to ensure your domain is authorized.

### For Development:
- Add `localhost` to authorized domains
- The reCAPTCHA will appear as an invisible challenge

### For Production:
- Add your production domain to authorized domains
- Consider using reCAPTCHA Enterprise for better control

## 3. Test Phone Authentication

1. **Start your development server**: `npm run dev`
2. **Go to a storefront page** (e.g., `http://localhost:3000/demo-store`)
3. **Click "Sign In"** button
4. **Select the "Phone" tab**
5. **Enter a phone number** (with country code, e.g., +1 for US)
6. **Click "Send SMS Code"**
7. **Check your phone** for the verification code
8. **Enter the code** and click "Verify Code"

## 4. Phone Number Format

- **Always include country code**: +1 (US), +44 (UK), +971 (UAE), etc.
- **Examples**:
  - US: `+1 555 123 4567`
  - UK: `+44 20 7946 0958`
  - UAE: `+971 50 123 4567`

## 5. Troubleshooting

### Common Issues:

1. **"reCAPTCHA verification failed"**
   - Make sure your domain is in the authorized domains list
   - Check browser console for errors

2. **"Invalid phone number"**
   - Ensure phone number includes country code
   - Check the format (no spaces or special characters except +)

3. **"SMS not received"**
   - Check if phone number is correct
   - Some carriers may block SMS from Firebase
   - Try a different phone number

4. **"This phone number is already in use"**
   - The phone number is already associated with another account
   - Use a different phone number or sign in with the existing account

## 6. Security Considerations

- **Rate Limiting**: Firebase has built-in rate limiting for SMS sending
- **Phone Number Verification**: Only verified phone numbers can be used
- **reCAPTCHA**: Prevents abuse and bot attacks
- **SMS Costs**: Firebase charges for SMS sent (check pricing)

## 7. Production Deployment

When deploying to production:

1. **Add production domain** to authorized domains
2. **Update environment variables** with production Firebase config
3. **Test thoroughly** with real phone numbers
4. **Monitor SMS usage** and costs
5. **Consider implementing** additional security measures

## 8. Code Implementation

The phone authentication is already implemented in:
- `lib/firebase/client.ts` - Firebase client configuration
- `contexts/FirebaseAuthContext.tsx` - Authentication context
- `components/storefront/CustomerAuth.tsx` - UI components

No additional code changes are needed - just enable it in Firebase Console!

