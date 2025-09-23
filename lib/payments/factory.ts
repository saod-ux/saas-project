/**
 * Payment Provider Factory
 * 
 * Creates the appropriate payment adapter based on tenant configuration
 */

import { PaymentAdapter, PaymentConfig } from './adapter';
import { TapAdapter } from './providers/tap';
import { MyFatoorahAdapter } from './providers/myfatoorah';
import { prisma } from '@/lib/prisma';

export async function getPaymentAdapter(tenantId: string): Promise<PaymentAdapter | null> {
  try {
    const config = await prisma.paymentConfig.findUnique({
      where: { tenantId }
    });

    if (!config || config.provider === 'NONE' || !config.isValid) {
      return null;
    }

    const paymentConfig: PaymentConfig = {
      provider: config.provider as any,
      mode: config.mode as 'sandbox' | 'live',
      tapPublicKey: config.tapPublicKey || undefined,
      tapSecretKey: config.tapSecretKey || undefined,
      myfatoorahApiKey: config.myfatoorahApiKey || undefined,
      paytabsProfileId: config.paytabsProfileId || undefined,
      paytabsServerKey: config.paytabsServerKey || undefined,
      hyperpayEntityId: config.hyperpayEntityId || undefined,
      hyperpayToken: config.hyperpayToken || undefined,
      webhookSecret: config.webhookSecret || undefined
    };

    switch (config.provider) {
      case 'TAP':
        return new TapAdapter(paymentConfig);
      case 'MYFATOORAH':
        return new MyFatoorahAdapter(paymentConfig);
      case 'PAYTABS':
        // TODO: Implement PayTabs adapter
        throw new Error('PayTabs adapter not implemented yet');
      case 'HYPERPAY':
        // TODO: Implement HyperPay adapter
        throw new Error('HyperPay adapter not implemented yet');
      default:
        return null;
    }
  } catch (error) {
    console.error('Error getting payment adapter:', error);
    return null;
  }
}

export function createPaymentAdapter(config: PaymentConfig): PaymentAdapter | null {
  switch (config.provider) {
    case 'TAP':
      return new TapAdapter(config);
    case 'MYFATOORAH':
      return new MyFatoorahAdapter(config);
    case 'PAYTABS':
      // TODO: Implement PayTabs adapter
      throw new Error('PayTabs adapter not implemented yet');
    case 'HYPERPAY':
      // TODO: Implement HyperPay adapter
      throw new Error('HyperPay adapter not implemented yet');
    default:
      return null;
  }
}


