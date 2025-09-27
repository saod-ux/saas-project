'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, Shield } from 'lucide-react';

function PlatformSignInContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    
    // Platform admin always redirects to platform dashboard
    if (userType === 'platform_admin') {
      return '/admin/platform';
    }
    
    // If not platform admin, redirect to platform sign-in
    return '/platform/sign-in';
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
        // Fallback to development bypass for platform admin
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
      console.error('Platform sign in error:', error);
      
      // Handle specific Firebase Auth error codes
      let errorMessage = 'Sign in failed';
      if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
            errorMessage = 'No platform admin account found with this email address';
            break;
          case 'auth/wrong-password':
            errorMessage = 'Incorrect password';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Invalid email address';
            break;
          case 'auth/user-disabled':
            errorMessage = 'This platform admin account has been disabled';
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-4 text-3xl font-bold text-gray-900">Platform Admin</h2>
          <p className="mt-2 text-sm text-gray-600">
            Secure access to platform administration
          </p>
        </div>
        
        <Card className="shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-blue-600">Platform Sign In</CardTitle>
            <CardDescription className="text-center">
              Enter your platform admin credentials to access the control panel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Platform Admin Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@platform.com"
                  className="border-blue-200 focus:border-blue-500"
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
                    placeholder="Enter your platform password"
                    className="pr-10 border-blue-200 focus:border-blue-500"
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
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700" 
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'Signing in...' : 'Access Platform'}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Platform admin access is restricted to authorized personnel only.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function PlatformSignInPage() {
  return (
    <Suspense fallback={null}>
      <PlatformSignInContent />
    </Suspense>
  );
}
