import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    
    if (!apiKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured. Please add it to your environment variables.');
    }
    
    stripeInstance = new Stripe(apiKey, {
      apiVersion: '2025-09-30.clover',
      typescript: true,
    });
  }
  
  return stripeInstance;
}

// Deprecated: kept for backwards compatibility
export const getStripeInstance = getStripe;