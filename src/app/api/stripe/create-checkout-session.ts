// app/api/stripe/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-04-10',
});

export async function POST(req: Request) {
  const origin = req.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  let body: any;
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { bookingId, amount, tutorName } = body ?? {};

  if (!bookingId || typeof amount === 'undefined' || !tutorName) {
    return NextResponse.json({ error: 'Missing booking details.' }, { status: 400 });
  }

  // Ensure amount is a number and convert to lowest currency unit (paisa)
  const unitAmount = Math.round(Number(amount) * 100);
  if (!Number.isFinite(unitAmount) || unitAmount <= 0) {
    return NextResponse.json({ error: 'Invalid amount provided.' }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'pkr',
            product_data: {
              name: `Tutoring Session with ${tutorName}`,
              description: `Booking ID: ${bookingId}`,
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/booking-success?session_id={CHECKOUT_SESSION_ID}&booking_id=${encodeURIComponent(
        bookingId
      )}`,
      cancel_url: `${origin}/tutor`,
      metadata: {
        bookingId: String(bookingId),
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error creating Stripe session';
    console.error('Stripe Error:', err);
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}
