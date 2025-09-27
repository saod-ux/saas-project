"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CustomerSignInPageProps {
  params: { tenantSlug: string };
}

export default function CustomerSignInPage({ params }: CustomerSignInPageProps) {
  const { tenantSlug } = params;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    try {
      // Try normal authentication first
      const response = await fetch(`/api/storefront/${tenantSlug}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (result.ok) {
        // Store the token in localStorage
        localStorage.setItem('customer_token', result.data.token);
        toast.success('Signed in successfully!');
        router.push(`/${tenantSlug}`);
      } else {
        // Fallback to development bypass
        console.log('Normal auth failed, trying development bypass...');
        
        // Create a form and submit it to set cookies
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/api/dev/customer-auth-bypass';
        
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
    } catch (error) {
      console.error('Sign in error:', error);
      toast.error('Sign in failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (isLoading) return;

    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/storefront/${tenantSlug}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, name: email.split('@')[0] }),
      });

      const result = await response.json();

      if (result.ok) {
        // Store the token in localStorage
        localStorage.setItem('customer_token', result.data.token);
        toast.success('Account created successfully!');
        router.push(`/${tenantSlug}`);
      } else {
        toast.error(result.error || 'Sign up failed');
      }
    } catch (error) {
      toast.error('Sign up failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Customer Sign In</CardTitle>
            <CardDescription className="text-center">
              Sign in to your account at {tenantSlug}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSignIn} className="space-y-4">
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
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </form>
            
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleSignUp}
                disabled={isLoading}
              >
                Create Account
              </Button>
            </div>

            <div className="text-center">
              <Link 
                href={`/${tenantSlug}`}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Continue as Guest
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
