"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, ExternalLink } from 'lucide-react';

interface CreateUserResponse {
  ok: boolean;
  created?: boolean;
  uid?: string;
  claims?: Record<string, any>;
  code?: string;
  message?: string;
}

export default function CreateUserPage() {
  const [formData, setFormData] = useState({
    email: 'fnissaan@hotmail.com',
    password: 'TestPassword123!',
    markVerified: true,
    claims: '{"role": "platform_admin"}',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CreateUserResponse | null>(null);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateClaims = (claimsString: string): Record<string, any> | null => {
    try {
      return JSON.parse(claimsString);
    } catch {
      return null;
    }
  };

  const handleCreateUser = async () => {
    if (!formData.email || !formData.password) {
      toast.error('Please enter email and password');
      return;
    }

    // Validate claims JSON
    const claims = validateClaims(formData.claims);
    if (formData.claims.trim() && !claims) {
      toast.error('Invalid JSON format for custom claims');
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/auth/create-test-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          markVerified: formData.markVerified,
          claims: claims || undefined,
        }),
      });

      const data: CreateUserResponse = await response.json();
      setResult(data);

      if (data.ok) {
        if (data.created) {
          toast.success(`User created successfully! UID: ${data.uid}`);
        } else {
          toast.info(`User already exists! UID: ${data.uid}`);
        }
      } else {
        toast.error(data.message || 'Failed to create user');
      }
    } catch (error) {
      const errorMessage = 'Network error occurred';
      toast.error(errorMessage);
      setResult({
        ok: false,
        code: 'NETWORK_ERROR',
        message: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Create Test Admin User</CardTitle>
            <CardDescription>
              Create a test user in Firebase Auth for troubleshooting authentication issues
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="user@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Enter strong password"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="markVerified"
                checked={formData.markVerified}
                onCheckedChange={(checked) => handleInputChange('markVerified', checked as boolean)}
              />
              <Label htmlFor="markVerified">Mark email as verified</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="claims">Custom Claims (JSON)</Label>
              <Textarea
                id="claims"
                value={formData.claims}
                onChange={(e) => handleInputChange('claims', e.target.value)}
                placeholder='{"role": "platform_admin"}'
                rows={3}
                className="font-mono text-sm"
              />
              <p className="text-sm text-gray-600">
                Optional: Custom claims to set for the user (must be valid JSON)
              </p>
            </div>

            <Button 
              onClick={handleCreateUser} 
              className="w-full" 
              disabled={isLoading}
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating User...
                </>
              ) : (
                'Create Test User'
              )}
            </Button>

            {/* Result Display */}
            {result && (
              <div className={`p-4 rounded-lg border ${
                result.ok 
                  ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                  : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
              }`}>
                <div className="flex items-start space-x-3">
                  {result.ok ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h3 className={`font-semibold ${
                      result.ok ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                    }`}>
                      {result.ok ? 'Success!' : 'Error'}
                    </h3>
                    <div className="mt-2 space-y-1 text-sm">
                      {result.ok && (
                        <>
                          <p><strong>Status:</strong> {result.created ? 'User Created' : 'User Already Exists'}</p>
                          <p><strong>UID:</strong> <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{result.uid}</code></p>
                          {result.claims && (
                            <p><strong>Claims:</strong> <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{JSON.stringify(result.claims)}</code></p>
                          )}
                        </>
                      )}
                      {!result.ok && (
                        <>
                          <p><strong>Code:</strong> {result.code}</p>
                          <p><strong>Message:</strong> {result.message}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Next Steps */}
            {result?.ok && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Next Steps:</h3>
                <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>1. Go to the <a href="/sign-in" className="underline font-medium">Sign In page</a></li>
                  <li>2. Use the email and password you just created</li>
                  <li>3. Click "Sign In" - it should work now!</li>
                </ol>
                <div className="mt-3">
                  <Button variant="outline" size="sm" asChild>
                    <a href="/sign-in" className="flex items-center">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Go to Sign In
                    </a>
                  </Button>
                </div>
              </div>
            )}

            {/* Debug Info */}
            <div className="text-xs text-gray-500 border-t pt-4">
              <p><strong>Environment:</strong> {process.env.NODE_ENV} | <strong>Vercel:</strong> {process.env.VERCEL_ENV || 'local'}</p>
              <p><strong>Firebase Project:</strong> e-view-7ebc8</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}