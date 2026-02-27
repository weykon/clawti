import { NextRequest, NextResponse } from 'next/server';
import { stripe, ENERGY_MAP } from '@/src/lib/stripe';
import { pool } from '@/src/lib/db';

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }

  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const priceKey = session.metadata?.priceKey;

        if (!userId || !priceKey) break;

        // Energy pack purchase
        const energyAmount = ENERGY_MAP[priceKey];
        if (energyAmount) {
          await pool.query(
            'UPDATE user_profiles SET energy = energy + $1 WHERE user_id = $2',
            [energyAmount, userId]
          );
        }

        // Subscription purchase
        if (['basic', 'explorer', 'godmode'].includes(priceKey)) {
          const planMap: Record<string, string> = {
            basic: 'basic', explorer: 'pro', godmode: 'unlimited',
          };
          await pool.query(
            `UPDATE user_profiles SET plan = $1, is_premium = true,
             stripe_customer_id = $2 WHERE user_id = $3`,
            [planMap[priceKey], session.customer, userId]
          );
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;
        await pool.query(
          "UPDATE user_profiles SET plan = 'free', is_premium = false WHERE stripe_customer_id = $1",
          [customerId]
        );
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook processing error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
