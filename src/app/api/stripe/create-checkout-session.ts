import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

// This is a placeholder for the secret key.
// In a real application, use environment variables.
const stripe = new Stripe(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY || '', {
    apiVersion: '2024-04-10',
});

/*
* README: How to configure and test Stripe
* 1. Set your Stripe secret key in an environment variable `NEXT_PUBLIC_STRIPE_SECRET_KEY`.
* 2. This endpoint creates a Checkout session and returns its ID.
* 3. The client-side code will use this ID to redirect the user to Stripe's checkout page.
* 4. Upon successful payment, Stripe redirects the user to `success_url`, which should be a page in your app.
* 5. The `success_url` should include query parameters to identify the booking. Here, we pass `booking_id`.
* 6. On the success page, you read the `booking_id` and update its payment status in Firestore.
*
* Production Webhook (Optional but Recommended):
* - Create another API route (e.g., `/api/stripe/webhook`).
* - Configure this endpoint in your Stripe dashboard.
* - Use `stripe.webhooks.constructEvent` to verify the event signature.
* - Handle the `checkout.session.completed` event to reliably update your database, as client-side redirects can fail.
*/

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }

    const { bookingId, amount, tutorName } = req.body;

    if (!bookingId || !amount || !tutorName) {
        return res.status(400).json({ error: 'Missing booking details.' });
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
                        unit_amount: amount * 100, // Amount in lowest currency unit (e.g., paisa)
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${req.headers.origin}/booking-success?session_id={CHECKOUT_SESSION_ID}&booking_id=${bookingId}`,
            cancel_url: `${req.headers.origin}/tutor`,
            metadata: {
                bookingId: bookingId,
            },
        });

        res.status(200).json({ sessionId: session.id });
    } catch (err) {
        const error = err as Stripe.errors.StripeError;
        console.error("Stripe Error:", error.message);
        res.status(500).json({ error: { message: error.message } });
    }
}
