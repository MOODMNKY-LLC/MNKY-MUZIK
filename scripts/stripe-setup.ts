/**
 * One-time Stripe setup: ensure Premium product and a recurring monthly price exist.
 * Run: pnpm run stripe:setup (loads .env.local and runs this script)
 * Requires: STRIPE_SECRET_KEY; optional SUPABASE_* to sync to DB immediately (else webhooks sync later).
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types_db';

const PRODUCT_NAME = 'Premium';
const PRODUCT_DESCRIPTION = 'Premium subscription for full music playback access';
const PRICE_AMOUNT_CENTS = 999; // $9.99
const PRICE_CURRENCY = 'usd';
const PRICE_INTERVAL = 'month' as const;

async function main() {
  const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!stripeKey) {
    console.error('Missing STRIPE_SECRET_KEY in .env.local');
    process.exit(1);
  }

  const stripe = new Stripe(stripeKey, {
    apiVersion: '2025-02-24.acacia',
    typescript: true,
  });

  // 1) Find or create Premium product
  const { data: products } = await stripe.products.list({ active: true, limit: 100 });
  let product = products?.find((p) => p.name === PRODUCT_NAME);

  if (!product) {
    product = await stripe.products.create({
      name: PRODUCT_NAME,
      description: PRODUCT_DESCRIPTION,
      active: true,
    });
    console.log('Created product:', product.id, product.name);
  } else {
    console.log('Using existing product:', product.id, product.name);
  }

  // 2) Find or create recurring monthly price
  const { data: prices } = await stripe.prices.list({
    product: product.id,
    active: true,
    limit: 100,
  });
  const recurringMonthly = prices?.find(
    (p) => p.recurring?.interval === PRICE_INTERVAL && p.unit_amount === PRICE_AMOUNT_CENTS && p.currency === PRICE_CURRENCY
  );

  let priceId: string;
  if (recurringMonthly) {
    priceId = recurringMonthly.id;
    console.log('Using existing recurring price:', priceId, `$${PRICE_AMOUNT_CENTS / 100}/${PRICE_INTERVAL}`);
  } else {
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: PRICE_AMOUNT_CENTS,
      currency: PRICE_CURRENCY,
      recurring: { interval: PRICE_INTERVAL },
      active: true,
    });
    priceId = price.id;
    console.log('Created recurring price:', priceId, `$${PRICE_AMOUNT_CENTS / 100}/${PRICE_INTERVAL}`);
  }

  // 3) Optionally sync product + price to Supabase (so app shows them before webhooks run)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (supabaseUrl && supabaseServiceKey) {
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);
    const productRow: Database['public']['Tables']['products']['Insert'] = {
      id: product.id,
      active: product.active ?? true,
      name: product.name ?? PRODUCT_NAME,
      description: product.description ?? PRODUCT_DESCRIPTION,
      image: product.images?.[0] ?? null,
      metadata: (product.metadata ?? {}) as Record<string, unknown>,
    };
    await supabase.from('products').upsert([productRow]);

    const priceDetails = await stripe.prices.retrieve(priceId, { expand: ['product'] });
    const priceRow: Database['public']['Tables']['prices']['Insert'] = {
      id: priceDetails.id,
      product_id: product.id,
      active: priceDetails.active ?? true,
      currency: priceDetails.currency ?? PRICE_CURRENCY,
      unit_amount: priceDetails.unit_amount ?? PRICE_AMOUNT_CENTS,
      type: 'recurring',
      interval: (priceDetails.recurring?.interval ?? PRICE_INTERVAL) as Database['public']['Enums']['pricing_plan_interval'],
      interval_count: priceDetails.recurring?.interval_count ?? 1,
      metadata: (priceDetails.metadata ?? {}) as Record<string, unknown>,
    };
    await supabase.from('prices').upsert([priceRow]);
    console.log('Synced product and price to Supabase.');
  } else {
    console.log('Supabase env not set; run migrations and webhooks will sync when Stripe sends events.');
  }

  console.log('\nDone. Price ID for subscription checkout:', priceId);
  console.log('Register webhook in Stripe Dashboard: Developers → Webhooks → Add endpoint');
  console.log('  URL: https://your-domain.com/api/webhooks (or http://localhost:3000/api/webhooks for CLI testing)');
  console.log('  Events: product.created, product.updated, price.created, price.updated, checkout.session.completed, customer.subscription.created, customer.subscription.updated, customer.subscription.deleted');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
