'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, Phone } from 'lucide-react';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import type { ConfirmationResult as WebConfirmationResult } from 'firebase/auth';

interface CustomerAuthProps {
  tenantSlug: string;
  onSuccess?: (customer: any) => void;
  onClose?: () => void;
}

export default function CustomerAuth({ tenantSlug, onSuccess, onClose }: CustomerAuthProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [phoneConfirmation, setPhoneConfirmation] = useState<WebConfirmationResult | null>(null);
  const [phoneCode, setPhoneCode] = useState('');
  const { signInWithPhone, confirmPhoneCode } = useFirebaseAuth();

  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });

  const [signupData, setSignupData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
  });

  const [phoneData, setPhoneData] = useState({
    phoneNumber: '',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/storefront/${tenantSlug}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.error || 'Login failed');
      }

      // Store token in localStorage
      localStorage.setItem('customer_token', result.data.token);
      localStorage.setItem('customer_data', JSON.stringify(result.data.customer));

      toast.success('Welcome back!');
      onSuccess?.(result.data.customer);
      onClose?.();
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/storefront/${tenantSlug}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupData),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.error || 'Signup failed');
      }

      // Store token in localStorage
      localStorage.setItem('customer_token', result.data.token);
      localStorage.setItem('customer_data', JSON.stringify(result.data.customer));

      toast.success('Account created successfully!');
      onSuccess?.(result.data.customer);
      onClose?.();
    } catch (error: any) {
      toast.error(error.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    try {
      // Format phone number with country code if not already present
      let phoneNumber = phoneData.phoneNumber;
      if (!phoneNumber.startsWith('+')) {
        phoneNumber = '+1' + phoneNumber; // Default to US country code
      }

      const confirmationResult = await signInWithPhone(phoneNumber);
      setPhoneConfirmation(confirmationResult as unknown as WebConfirmationResult);
      toast.success('SMS code sent to your phone!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send SMS code');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneCodeVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || !phoneConfirmation) return;

    setIsLoading(true);
    try {
      await confirmPhoneCode(phoneConfirmation, phoneCode);
      toast.success('Phone authentication successful!');
      onSuccess?.({ phoneNumber: phoneData.phoneNumber });
    } catch (error: any) {
      toast.error(error.message || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="relative shadow-2xl border-0 bg-white rounded-xl">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">Welcome</CardTitle>
                <CardDescription className="text-gray-600">Sign in to your account or create a new one</CardDescription>
              </div>
              {onClose && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onClose}
                  className="h-8 w-8 p-0 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-lg">
                <TabsTrigger 
                  value="login"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 text-gray-600"
                >
                  Login
                </TabsTrigger>
                <TabsTrigger 
                  value="signup"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 text-gray-600"
                >
                  Sign Up
                </TabsTrigger>
                <TabsTrigger 
                  value="phone"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 text-gray-600"
                >
                  Phone
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4 mt-6">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-sm font-medium text-gray-700">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      required
                      placeholder="Enter your email"
                      className="border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-sm font-medium text-gray-700">Password</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        required
                        placeholder="Enter your password"
                        className="border-gray-300 focus:border-gray-500 focus:ring-gray-500 pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 hover:text-gray-600"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-2.5" 
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4 mt-6">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-sm font-medium text-gray-700">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      value={signupData.name}
                      onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                      required
                      placeholder="Enter your full name"
                      className="border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-sm font-medium text-gray-700">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={signupData.email}
                      onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                      required
                      placeholder="Enter your email"
                      className="border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-phone" className="text-sm font-medium text-gray-700">Phone (Optional)</Label>
                    <Input
                      id="signup-phone"
                      type="tel"
                      value={signupData.phone}
                      onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                      placeholder="Enter your phone number"
                      className="border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-sm font-medium text-gray-700">Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? 'text' : 'password'}
                        value={signupData.password}
                        onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                        required
                        placeholder="Create a password"
                        minLength={6}
                        className="border-gray-300 focus:border-gray-500 focus:ring-gray-500 pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 hover:text-gray-600"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-2.5" 
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Account
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="phone" className="space-y-4 mt-6">
                {!phoneConfirmation ? (
                  <form onSubmit={handlePhoneLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone-number" className="text-sm font-medium text-gray-700">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="phone-number"
                          type="tel"
                          value={phoneData.phoneNumber}
                          onChange={(e) => setPhoneData({ ...phoneData, phoneNumber: e.target.value })}
                          required
                          placeholder="+1 (555) 123-4567"
                          className="border-gray-300 focus:border-gray-500 focus:ring-gray-500 pl-10"
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        Enter your phone number with country code (e.g., +1 for US)
                      </p>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-2.5" 
                      disabled={isLoading}
                    >
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Send SMS Code
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handlePhoneCodeVerification} className="space-y-4">
                    <div className="text-center mb-4">
                      <p className="text-sm text-gray-600">
                        We sent a verification code to <strong>{phoneData.phoneNumber}</strong>
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="verification-code" className="text-sm font-medium text-gray-700">Verification Code</Label>
                      <Input
                        id="verification-code"
                        type="text"
                        value={phoneCode}
                        onChange={(e) => setPhoneCode(e.target.value)}
                        required
                        placeholder="Enter 6-digit code"
                        className="border-gray-300 focus:border-gray-500 focus:ring-gray-500 text-center text-lg tracking-widest"
                        maxLength={6}
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-2.5" 
                      disabled={isLoading}
                    >
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Verify Code
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline"
                      className="w-full border-gray-300 text-gray-700 hover:bg-gray-50" 
                      onClick={() => {
                        setPhoneConfirmation(null);
                        setPhoneCode('');
                      }}
                    >
                      Change Phone Number
                    </Button>
                  </form>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
          </Card>
        </div>
      </div>
      {/* reCAPTCHA container for phone authentication */}
      <div id="recaptcha-container"></div>
    </div>
  );
}