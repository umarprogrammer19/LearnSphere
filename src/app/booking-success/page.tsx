"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const { firestore } = initializeFirebase();

function BookingSuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const bookingId = searchParams.get('booking_id');
    const sessionId = searchParams.get('session_id');

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (!bookingId || !sessionId) {
            setErrorMessage('Invalid session details. Please go to your dashboard to see booking status.');
            setStatus('error');
            return;
        }

        const updateBookingStatus = async () => {
            try {
                const bookingRef = doc(firestore, 'bookings', bookingId);
                await updateDoc(bookingRef, {
                    paymentStatus: 'paid',
                    stripeSessionId: sessionId,
                    updatedAt: serverTimestamp(),
                });
                setStatus('success');
            } catch (error: any) {
                console.error('Failed to update booking:', error);
                setErrorMessage('Failed to update booking status. Please check your dashboard or contact support.');
                setStatus('error');
            }
        };

        updateBookingStatus();
    }, [bookingId, sessionId]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md shadow-lg text-center">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold font-headline">
                        {status === 'loading' && 'Processing Payment...'}
                        {status === 'success' && 'Payment Successful!'}
                        {status === 'error' && 'Payment Failed'}
                    </CardTitle>
                    <CardDescription>
                        {status === 'loading' && 'Please wait while we confirm your payment.'}
                        {status === 'success' && 'Your booking request has been sent to the tutor.'}
                        {status === 'error' && errorMessage}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center space-y-4">
                    {status === 'loading' && <Loader2 className="h-16 w-16 animate-spin text-primary" />}
                    {status === 'success' && <CheckCircle className="h-16 w-16 text-green-500" />}
                    {status === 'error' && <XCircle className="h-16 w-16 text-destructive" />}

                    <Button asChild className="w-full">
                        <Link href="/dashboard">Go to Dashboard</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}


export default function BookingSuccessPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin"/></div>}>
            <BookingSuccessContent />
        </Suspense>
    );
}
