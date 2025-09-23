/**
 * Tap Payments Adapter
 * 
 * Kuwait-based payment provider
 * Documentation: https://www.tap.company/developers/
 */

import { PaymentAdapter, PaymentConfig } from '../adapter';
import crypto from 'crypto';

export class TapAdapter implements PaymentAdapter {
  private config: PaymentConfig;
  private baseUrl: string;

  constructor(config: PaymentConfig) {
    this.config = config;
    this.baseUrl = config.mode === 'live' 
      ? 'https://api.tap.company/v2'
      : 'https://api.tap.company/v2';
  }

  async createHostedCheckout(input: {
    tenantId: string;
    amountMinor: number;
    currency: string;
    orderId?: string;
    customer?: { name?: string; email?: string; phone?: string };
    redirectUrls: { success: string; cancel: string; failure: string };
  }): Promise<{ redirectUrl: string; externalId: string }> {
    const amount = input.amountMinor / 1000; // Convert from fils to KWD (3 decimals)

    const payload = {
      amount: amount,
      currency: input.currency,
      threeDSecure: true,
      save_card: false,
      description: `Payment for order ${input.orderId || 'unknown'}`,
      statement_descriptor: 'E-View Store',
      metadata: {
        udf1: input.tenantId,
        udf2: input.orderId || '',
        udf3: 'e-view-platform'
      },
      reference: {
        transaction: input.orderId || `txn_${Date.now()}`,
        order: input.orderId || `order_${Date.now()}`
      },
      receipt: {
        email: true,
        sms: true
      },
      customer: {
        first_name: input.customer?.name?.split(' ')[0] || 'Customer',
        last_name: input.customer?.name?.split(' ').slice(1).join(' ') || '',
        email: input.customer?.email || '',
        phone: {
          country_code: '965', // Kuwait
          number: input.customer?.phone?.replace(/^\+965/, '') || ''
        }
      },
      merchant: {
        id: this.config.tapPublicKey
      },
      source: {
        id: 'src_all'
      },
      redirect: {
        url: input.redirectUrls.success
      },
      post: {
        url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payments/webhooks/tap`
      }
    };

    const response = await fetch(`${this.baseUrl}/charges`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.tapSecretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Tap API error: ${error}`);
    }

    const data = await response.json();
    
    return {
      redirectUrl: data.transaction.url,
      externalId: data.id
    };
  }

  async verifyWebhook(opts: {
    req: Request;
    rawBody: string | Buffer;
    headers: Headers;
  }): Promise<{
    ok: boolean;
    externalId?: string;
    status?: 'SUCCEEDED' | 'FAILED' | 'CANCELED' | 'REFUNDED';
    payload?: any;
  }> {
    try {
      const signature = opts.headers.get('x-tap-signature');
      if (!signature) {
        return { ok: false };
      }

      // Verify signature
      const expectedSignature = crypto
        .createHmac('sha256', this.config.webhookSecret || '')
        .update(opts.rawBody)
        .digest('hex');

      if (signature !== expectedSignature) {
        return { ok: false };
      }

      const payload = JSON.parse(opts.rawBody.toString());
      
      // Map Tap status to our status
      let status: 'SUCCEEDED' | 'FAILED' | 'CANCELED' | 'REFUNDED';
      switch (payload.status) {
        case 'CAPTURED':
          status = 'SUCCEEDED';
          break;
        case 'FAILED':
        case 'DECLINED':
          status = 'FAILED';
          break;
        case 'CANCELLED':
          status = 'CANCELED';
          break;
        case 'REFUNDED':
          status = 'REFUNDED';
          break;
        default:
          return { ok: false };
      }

      return {
        ok: true,
        externalId: payload.id,
        status,
        payload
      };
    } catch (error) {
      console.error('Tap webhook verification error:', error);
      return { ok: false };
    }
  }

  async testConnection(): Promise<{ ok: boolean; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/charges`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.tapSecretKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        return { ok: true, message: 'Connection successful' };
      } else {
        const error = await response.text();
        return { ok: false, message: `Connection failed: ${error}` };
      }
    } catch (error) {
      return { ok: false, message: `Connection error: ${error}` };
    }
  }
}


