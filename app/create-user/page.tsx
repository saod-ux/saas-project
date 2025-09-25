"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function CreateUserPage() {
  const [email, setEmail] = useState('fnissaan@hotmail.com');
  const [password, setPassword] = useState('testpassword123');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateUser = async () => {
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.ok) {
        toast.success(`User created successfully! UID: ${data.uid}`);
        console.log('User created:', data);
      } else {
        if (data.code === 'EMAIL_EXISTS') {
          toast.info('User already exists - you can now sign in!');
        } else {
          toast.error(data.error || 'Failed to create user');
        }
        console.error('Create user error:', data);
      }
    } catch (error) {
      toast.error('Network error');
      console.error('Network error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Create Test User</CardTitle>
          <CardDescription>
            Create a user account in Firebase Auth for testing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
            />
          </div>
          <Button 
            onClick={handleCreateUser} 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create User'}
          </Button>
          <div className="text-sm text-gray-600 text-center">
            <p>After creating the user, you can:</p>
            <p>1. Go to <a href="/sign-in" className="text-blue-600 underline">Sign In</a></p>
            <p>2. Use the same email/password to log in</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
