import Stripe from 'stripe';

let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  _stripe = new Stripe(key, {
    apiVersion: '2025-02-24.acacia',
    appInfo: {
      name: 'Spotify Clone Application',
      version: '0.1.0',
    },
  });
  return _stripe;
}

// Lazy proxy so Stripe is only initialized when used (avoids build failure when env is missing)
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return getStripe()[prop as keyof Stripe];
  },
});
