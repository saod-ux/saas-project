'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

function AdminSignInContent() {
  const [email, setEmail] = useState('admin@test.com');
  const [password, setPassword] = useState('TestPassword123!');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, createSession, firebaseReady } = useFirebaseAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const getRedirectUrl = (userType?: string, roles?: { platformRole?: string; tenantRole?: string; tenantSlug?: string }) => {
    // Get redirect from query params
    const redirect = searchParams.get('redirect');
    if (redirect) {
      return redirect;
    }
    
    // Use user type and roles from session if available
    if (userType) {
      switch (userType) {
        case 'platform_admin':
          return '/admin/platform';
        case 'merchant_admin':
          const tenantSlug = roles?.tenantSlug || 'demo-store';
          return `/admin/${tenantSlug}/overview`;
        default:
          return '/admin/demo-store/overview';
      }
    }
    
    // If no user type from session, redirect to admin sign-in
    // This should not happen if custom claims are properly set
    return '/admin/sign-in';
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    try {
      // Try Firebase authentication first
      if (firebaseReady) {
        await signIn(email, password);
        toast.success('Signed in successfully!');
        
        // Get roles from session and redirect accordingly
        const idToken = await (window as any).firebase?.auth()?.currentUser?.getIdToken();
        if (idToken) {
          const sessionData = await createSession(idToken);
          window.location.href = getRedirectUrl(sessionData.userType, sessionData.roles);
        } else {
          window.location.href = getRedirectUrl();
        }
      } else {
        // Fallback to development bypass - use form submission to set cookies
        console.log('Firebase not ready, using development bypass...');
        
        // Create a form and submit it to set cookies
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/api/dev/auth-bypass';
        
        const emailInput = document.createElement('input');
        emailInput.type = 'hidden';
        emailInput.name = 'email';
        emailInput.value = email;
        
        const passwordInput = document.createElement('input');
        passwordInput.type = 'hidden';
        passwordInput.name = 'password';
        passwordInput.value = password;
        
        form.appendChild(emailInput);
        form.appendChild(passwordInput);
        document.body.appendChild(form);
        
        // Submit the form to set cookies and redirect
        form.submit();
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      
      // Handle specific Firebase Auth error codes
      let errorMessage = 'Sign in failed';
      if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
            errorMessage = 'No account found with this email address';
            break;
          case 'auth/wrong-password':
            errorMessage = 'Incorrect password';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Invalid email address';
            break;
          case 'auth/user-disabled':
            errorMessage = 'This account has been disabled';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Too many failed attempts. Please try again later';
            break;
          case 'auth/network-request-failed':
            errorMessage = 'Network error. Please check your connection';
            break;
          default:
            errorMessage = `Authentication error: ${error.code}`;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Admin Sign In</CardTitle>
            <CardDescription className="text-center">
              Enter your admin credentials to access the dashboard
            </CardDescription>
            {!firebaseReady && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mt-2">
                <p className="text-sm text-yellow-800">
                  🔧 Development Mode: Using authentication bypass
                </p>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your admin email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AdminSignInPage() {
  return (
    <Suspense fallback={null}>
      <AdminSignInContent />
    </Suspense>
  );
}
