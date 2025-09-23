/**
 * Payment Adapter Interface
 * 
 * Provider-agnostic interface for payment processing
 * Supports Kuwait-ready payment providers: Tap, MyFatoorah, PayTabs, HyperPay
 */

export interface PaymentAdapter {
  /**
   * Create a hosted checkout session
   */
  createHostedCheckout(input: {
    tenantId: string;
    amountMinor: number; // Amount in minor units (e.g., 2500 = 2.500 KWD)
    currency: string; // e.g., "KWD"
    orderId?: string;
    customer?: {
      name?: string;
      email?: string;
      phone?: string;
    };
    redirectUrls: {
      success: string;
      cancel: string;
      failure: string;
    };
  }): Promise<{
    redirectUrl: string;
    externalId: string;
  }>;

  /**
   * Verify webhook signature and extract payment data
   */
  verifyWebhook(opts: {
    req: Request;
    rawBody: string | Buffer;
    headers: Headers;
  }): Promise<{
    ok: boolean;
    externalId?: string;
    status?: 'SUCCEEDED' | 'FAILED' | 'CANCELED' | 'REFUNDED';
    payload?: any;
  }>;

  /**
   * Test connection to payment provider
   */
  testConnection(): Promise<{
    ok: boolean;
    message?: string;
  }>;
}

export type PaymentProvider = 'NONE' | 'TAP' | 'MYFATOORAH' | 'PAYTABS' | 'HYPERPAY';

export interface PaymentConfig {
  provider: PaymentProvider;
  mode: 'sandbox' | 'live';
  
  // Tap Payments
  tapPublicKey?: string;
  tapSecretKey?: string;
  
  // MyFatoorah
  myfatoorahApiKey?: string;
  
  // PayTabs
  paytabsProfileId?: string;
  paytabsServerKey?: string;
  
  // HyperPay
  hyperpayEntityId?: string;
  hyperpayToken?: string;
  
  // Common
  webhookSecret?: string;
}


