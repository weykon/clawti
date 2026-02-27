import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY not set — Stripe features disabled');
}

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

/** Price IDs — replace with your actual Stripe price IDs */
export const PRICES = {
  // Subscriptions
  basic: process.env.STRIPE_PRICE_BASIC || 'price_basic_placeholder',
  explorer: process.env.STRIPE_PRICE_EXPLORER || 'price_explorer_placeholder',
  godmode: process.env.STRIPE_PRICE_GODMODE || 'price_godmode_placeholder',
  // Energy packs (one-time)
  energy_100: process.env.STRIPE_PRICE_E100 || 'price_e100_placeholder',
  energy_500: process.env.STRIPE_PRICE_E500 || 'price_e500_placeholder',
  energy_1000: process.env.STRIPE_PRICE_E1000 || 'price_e1000_placeholder',
  energy_2500: process.env.STRIPE_PRICE_E2500 || 'price_e2500_placeholder',
  lucky_box: process.env.STRIPE_PRICE_LUCKY || 'price_lucky_placeholder',
} as const;

/** Map plan/pack name to energy amount */
export const ENERGY_MAP: Record<string, number> = {
  energy_100: 100,
  energy_500: 500,
  energy_1000: 1000,
  energy_2500: 2500,
  lucky_box: Math.floor(Math.random() * 500) + 100, // 100-600 random
};
