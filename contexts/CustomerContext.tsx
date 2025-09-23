'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface Customer {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  isGuest: boolean;
}

interface CustomerContextType {
  customer: Customer | null;
  isLoading: boolean;
  login: (customer: Customer, token: string) => void;
  logout: () => void;
  refreshCustomer: () => Promise<void>;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

interface CustomerProviderProps {
  children: ReactNode;
  tenantSlug: string;
}

export function CustomerProvider({ children, tenantSlug }: CustomerProviderProps) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = (customerData: Customer, token: string) => {
    setCustomer(customerData);
    localStorage.setItem('customer_token', token);
    localStorage.setItem('customer_data', JSON.stringify(customerData));
  };

  const logout = () => {
    setCustomer(null);
    localStorage.removeItem('customer_token');
    localStorage.removeItem('customer_data');
  };

  const refreshCustomer = async () => {
    const token = localStorage.getItem('customer_token');
    if (!token) {
      setCustomer(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/storefront/${tenantSlug}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.ok) {
          setCustomer(result.data.customer);
        } else {
          logout();
        }
      } else {
        logout();
      }
    } catch (error) {
      console.error('Failed to refresh customer:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check for existing session on mount
    const token = localStorage.getItem('customer_token');
    const customerData = localStorage.getItem('customer_data');

    if (token && customerData) {
      try {
        const parsedCustomer = JSON.parse(customerData);
        setCustomer(parsedCustomer);
        // Verify token is still valid
        refreshCustomer();
      } catch (error) {
        logout();
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, [tenantSlug]);

  return (
    <CustomerContext.Provider value={{ customer, isLoading, login, logout, refreshCustomer }}>
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer() {
  const context = useContext(CustomerContext);
  if (context === undefined) {
    throw new Error('useCustomer must be used within a CustomerProvider');
  }
  return context;
}

