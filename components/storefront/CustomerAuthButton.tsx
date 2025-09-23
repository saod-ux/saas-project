'use client';

import { useState } from 'react';
import { useCustomer } from '@/contexts/CustomerContext';
import { Button } from '@/components/ui/button';
import { User, LogOut } from 'lucide-react';
import CustomerAuth from './CustomerAuth';

interface CustomerAuthButtonProps {
  tenantSlug: string;
}

export default function CustomerAuthButton({ tenantSlug }: CustomerAuthButtonProps) {
  const { customer, logout } = useCustomer();
  const [showAuth, setShowAuth] = useState(false);

  const handleLogout = () => {
    logout();
  };

  if (customer) {
    return (
      <div className="flex items-center gap-2">
        <a
          href={`/${tenantSlug}/account`}
          className="p-3 rounded-full hover:bg-gray-100 transition-colors duration-200 group"
          aria-label="My Account"
        >
          <User className="h-5 w-5 text-gray-600 group-hover:text-gray-900 group-hover:scale-110 transition-all" />
        </a>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        >
          <LogOut className="h-4 w-4 mr-1" />
          Logout
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowAuth(true)}
        className="border-gray-300 text-gray-700 hover:text-gray-900 hover:border-gray-400 hover:bg-gray-50"
      >
        <User className="h-4 w-4 mr-1" />
        Sign In
      </Button>
      
      {showAuth && (
        <CustomerAuth
          tenantSlug={tenantSlug}
          onClose={() => setShowAuth(false)}
          onSuccess={() => setShowAuth(false)}
        />
      )}
    </>
  );
}
