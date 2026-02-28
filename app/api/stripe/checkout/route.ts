import { NextResponse } from 'next/server';
import { stripe, PRICES } from '@/src/lib/stripe';
import { authRoute } from '@/src/lib/apiRoute';

export const POST = authRoute(async (req, { userId }) => {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }

  const { priceKey } = await req.json();

  if (!priceKey || typeof priceKey !== 'string') {
    return NextResponse.json({ error: 'Invalid price key' }, { status: 400 });
  }

  const priceId = PRICES[priceKey as keyof typeof PRICES];
  if (!priceId) {
    return NextResponse.json({ error: 'Invalid price key' }, { status: 400 });
  }

  const isSubscription = ['basic', 'explorer', 'godmode'].includes(priceKey);

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: isSubscription ? 'subscription' : 'payment',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${req.nextUrl.origin}/profile?payment=success`,
    cancel_url: `${req.nextUrl.origin}/profile?payment=cancelled`,
    metadata: {
      userId,
      priceKey,
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
});
