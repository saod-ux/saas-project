/**
 * MyFatoorah Adapter
 * 
 * Kuwait-based payment provider
 * Documentation: https://myfatoorah.readme.io/
 */

import { PaymentAdapter, PaymentConfig } from '../adapter';

export class MyFatoorahAdapter implements PaymentAdapter {
  private config: PaymentConfig;
  private baseUrl: string;

  constructor(config: PaymentConfig) {
    this.config = config;
    this.baseUrl = config.mode === 'live' 
      ? 'https://api.myfatoorah.com'
      : 'https://apitest.myfatoorah.com';
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
      InvoiceAmount: amount,
      CurrencyIso: input.currency,
      CustomerName: input.customer?.name || 'Customer',
      CustomerEmail: input.customer?.email || '',
      CustomerMobile: input.customer?.phone || '',
      DisplayCurrencyIso: input.currency,
      MobileCountryCode: '+965',
      CustomerReference: input.orderId || `order_${Date.now()}`,
      UserDefinedField: input.tenantId,
      CallBackUrl: input.redirectUrls.success,
      ErrorUrl: input.redirectUrls.failure,
      Language: 'en',
      ExpireDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      ApiCustomFileds: 'e-view-platform',
      CreateInvoiceBaselineItem: [
        {
          ItemName: `Order ${input.orderId || 'Unknown'}`,
          Quantity: 1,
          UnitPrice: amount
        }
      ]
    };

    const response = await fetch(`${this.baseUrl}/v2/SendPayment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.myfatoorahApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`MyFatoorah API error: ${error}`);
    }

    const data = await response.json();
    
    if (!data.IsSuccess) {
      throw new Error(`MyFatoorah error: ${data.Message}`);
    }

    return {
      redirectUrl: data.Data.InvoiceURL,
      externalId: data.Data.InvoiceId.toString()
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
      const payload = JSON.parse(opts.rawBody.toString());
      
      // MyFatoorah sends payment status updates
      if (!payload.IsSuccess) {
        return { ok: false };
      }

      const paymentData = payload.Data;
      
      // Map MyFatoorah status to our status
      let status: 'SUCCEEDED' | 'FAILED' | 'CANCELED' | 'REFUNDED';
      switch (paymentData.InvoiceStatus) {
        case 'Paid':
          status = 'SUCCEEDED';
          break;
        case 'Failed':
          status = 'FAILED';
          break;
        case 'Cancelled':
          status = 'CANCELED';
          break;
        case 'Refunded':
          status = 'REFUNDED';
          break;
        default:
          return { ok: false };
      }

      return {
        ok: true,
        externalId: paymentData.InvoiceId.toString(),
        status,
        payload
      };
    } catch (error) {
      console.error('MyFatoorah webhook verification error:', error);
      return { ok: false };
    }
  }

  async testConnection(): Promise<{ ok: boolean; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/v2/GetPaymentStatus`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.myfatoorahApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          Key: 'test',
          KeyType: 'InvoiceId'
        })
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


