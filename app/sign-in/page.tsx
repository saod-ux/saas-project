'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, Phone } from 'lucide-react';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [phoneConfirmation, setPhoneConfirmation] = useState<any>(null);
  const [showPhoneAuth, setShowPhoneAuth] = useState(false);
  const { signIn, signInWithGoogle, signInWithPhone, confirmPhoneCode } = useFirebaseAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const getRedirectUrl = () => {
    // Get redirect from query params
    const redirect = searchParams.get('redirect');
    if (redirect) {
      return redirect;
    }
    
    // Default redirects based on context
    // If coming from admin context, go to admin platform
    if (window.location.pathname.includes('/admin') || searchParams.get('context') === 'admin') {
      return '/admin/platform';
    }
    
    // If coming from storefront context, go to demo store
    if (window.location.pathname.includes('/demo-store') || searchParams.get('context') === 'storefront') {
      return '/demo-store/retail';
    }
    
    // Default to admin platform
    return '/admin/platform';
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    try {
      await signIn(email, password);
      toast.success('Signed in successfully!');
      
      // Use window.location.href for a full page redirect to avoid hydration issues
      window.location.href = getRedirectUrl();
    } catch (error: any) {
      toast.error(error.message || 'Sign in failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      await signInWithGoogle();
      toast.success('Signed in successfully!');
      
      // Use window.location.href for a full page redirect to avoid hydration issues
      window.location.href = getRedirectUrl();
    } catch (error: any) {
      toast.error(error.message || 'Google sign in failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneLogin = async () => {
    if (isLoading || !phoneNumber) return;

    setIsLoading(true);
    try {
      const confirmation = await signInWithPhone(phoneNumber);
      setPhoneConfirmation(confirmation);
      toast.success('Verification code sent to your phone');
    } catch (error: any) {
      toast.error(error.message || 'Phone authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneCodeVerification = async () => {
    if (isLoading || !verificationCode || !phoneConfirmation) return;

    setIsLoading(true);
    try {
      await confirmPhoneCode(phoneConfirmation, verificationCode);
      toast.success('Signed in successfully!');
      
      // Use window.location.href for a full page redirect to avoid hydration issues
      window.location.href = getRedirectUrl();
    } catch (error: any) {
      toast.error(error.message || 'Phone verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Sign in</CardTitle>
            <CardDescription className="text-center">
              Enter your email and password to sign in to your account
            </CardDescription>
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
                  placeholder="Enter your email"
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
                Sign In
              </Button>
            </form>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>
            
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.45 1.19 14.97 0 12 0 7.7 0 3.99 2.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </Button>
            
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setShowPhoneAuth(!showPhoneAuth)}
              disabled={isLoading}
            >
              <Phone className="mr-2 h-4 w-4" />
              {showPhoneAuth ? 'Hide Phone Login' : 'Sign in with Phone'}
            </Button>
            
            {showPhoneAuth && (
              <div className="space-y-4 pt-4 border-t">
                {!phoneConfirmation ? (
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+1 (555) 123-4567"
                    />
                    <Button
                      type="button"
                      className="w-full"
                      onClick={handlePhoneLogin}
                      disabled={isLoading || !phoneNumber}
                    >
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Send Verification Code
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="code">Verification Code</Label>
                    <Input
                      id="code"
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="Enter 6-digit code"
                    />
                    <Button
                      type="button"
                      className="w-full"
                      onClick={handlePhoneCodeVerification}
                      disabled={isLoading || !verificationCode}
                    >
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Verify Code
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full text-sm"
                      onClick={() => {
                        setPhoneConfirmation(null);
                        setVerificationCode('');
                      }}
                    >
                      Use different phone number
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
