import { NextRequest, NextResponse } from 'next/server';
import { stripe, PRICES } from '@/src/lib/stripe';

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }

  // TODO: Add auth check
  // const session = await auth();
  // if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { priceKey, mode } = await req.json();

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
        // userId: session.user.id,
        priceKey,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Checkout failed' },
      { status: 500 }
    );
  }
}
