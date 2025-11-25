"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useUser } from '@/hooks/use-user';
import { useToast } from '@/hooks/use-toast';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, serverTimestamp, runTransaction, where, query, getDocs } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { Loader2 } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { useRouter } from 'next/navigation';
import { Badge } from './ui/badge';


const { firestore } = initializeFirebase();
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface BookingModalProps {
    tutor: any;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

export function BookingModal({ tutor, isOpen, setIsOpen }: BookingModalProps) {
    const { user, userData } = useUser();
    const router = useRouter();
    const { toast } = useToast();
    const [selectedSlot, setSelectedSlot] = useState<any | null>(null);
    const [sessionType, setSessionType] = useState<'online' | 'onsite'>('onsite');
    const [paymentMethod, setPaymentMethod] = useState<'payNow' | 'payCash' | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState(1);

    const availableSlots = tutor.availableSlots
        .filter((day: any) => day.slots.length > 0)
        .flatMap((day: any) => day.slots.map((slot: any) => ({ ...slot, day: day.day })));

    const resetState = () => {
        setSelectedSlot(null);
        setSessionType('onsite');
        setPaymentMethod(null);
        setIsLoading(false);
        setStep(1);
    };

    const handleClose = () => {
        setIsOpen(false);
        resetState();
    };

    const handleConfirmBooking = async () => {
        if (!user || !userData) {
            toast({ variant: 'destructive', title: 'You must be logged in to book.' });
            router.push('/login');
            return;
        }
        if (!selectedSlot) {
            toast({ variant: 'destructive', title: 'Please select a time slot.' });
            return;
        }

        setIsLoading(true);

        try {
            
            const bookingsRef = collection(firestore, "bookings");
            const q = query(bookingsRef,
                where("tutorId", "==", tutor.id),
                where("slot.day", "==", selectedSlot.day),
                where("slot.startTime", "==", selectedSlot.startTime),
                where("lessonConfirmed", "==", true)
            );
            const existingBookings = await getDocs(q);
            if (existingBookings.docs.length >= selectedSlot.availableSeats) {
                toast({ variant: 'destructive', title: 'Booking Failed', description: "This slot is already full." });
                setIsLoading(false);
                return;
            }


            const finalPaymentMethod = sessionType === 'online' ? 'stripe' : (paymentMethod === 'payNow' ? 'stripe' : 'cash');
            const finalPaymentStatus = sessionType === 'online' || paymentMethod === 'payNow' ? 'pending' : 'cash_pending';

            const bookingData = {
                studentId: user.uid,
                studentName: `${userData.firstName} ${userData.lastName}`,
                studentEmail: userData.email,
                tutorId: tutor.id,
                tutorName: `${tutor.firstName} ${tutor.lastName}`,
                slot: selectedSlot,
                sessionType,
                paymentMethod: finalPaymentMethod,
                paymentStatus: finalPaymentStatus,
                lessonConfirmed: false,
                createdAt: serverTimestamp(),
                amount: tutor.hourlyPricing,
            };

            const newBookingRef = await addDocumentNonBlocking(collection(firestore, "bookings"), bookingData);

            if (finalPaymentMethod === 'stripe') {
                const res = await fetch('/api/stripe/create-checkout-session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        bookingId: newBookingRef!.id,
                        amount: tutor.hourlyPricing,
                        tutorName: `${tutor.firstName} ${tutor.lastName}`,
                    }),
                });

                if (!res.ok) {
                    const errorBody = await res.json();
                    throw new Error(errorBody.error?.message || 'Failed to create Stripe session.');
                }

                const { sessionId } = await res.json();
                const stripe = await stripePromise;
                if (stripe) {
                    const { error } = await stripe.redirectToCheckout({ sessionId });
                    if (error) {
                        throw new Error(error.message);
                    }
                }

            } else {
                toast({ title: 'Booking Request Sent!', description: 'The teacher will confirm your lesson shortly.' });
                handleClose();
            }

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Booking Failed', description: error.message });
            setIsLoading(false);
        }
    };


    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Book a Session with {tutor.firstName}</DialogTitle>
                    <DialogDescription>
                        Select a time slot and your preferred session type.
                    </DialogDescription>
                </DialogHeader>

                {step === 1 && (
                    <div className="space-y-4 py-4">
                        <div>
                            <Label htmlFor="slot">Available Slots</Label>
                            <Select onValueChange={(value) => setSelectedSlot(JSON.parse(value))}>
                                <SelectTrigger id="slot">
                                    <SelectValue placeholder="Select a time slot" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableSlots.map((slot: any, index: number) => (
                                        <SelectItem key={index} value={JSON.stringify(slot)} disabled={slot.availableSeats <= 0}>
                                            <div className="flex justify-between w-full">
                                                <span>{slot.day}, {slot.startTime} - {slot.endTime}</span>
                                                {slot.availableSeats > 0 && <Badge variant={slot.availableSeats > 0 ? "secondary" : "secondary"}>
                                                    {slot.availableSeats > 0 ? `${slot.availableSeats} seats left` : null}
                                                </Badge>}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Session Type</Label>
                            <RadioGroup defaultValue="onsite" value={sessionType} onValueChange={(value: 'online' | 'onsite') => setSessionType(value)} className="flex gap-4 mt-2">
                                <Label htmlFor="onsite" className="flex items-center gap-2 border p-3 rounded-lg cursor-pointer flex-1">
                                    <RadioGroupItem value="onsite" id="onsite" />
                                    On-site
                                </Label>
                                <Label htmlFor="online" className="flex items-center gap-2 border p-3 rounded-lg cursor-pointer flex-1">
                                    <RadioGroupItem value="online" id="online" />
                                    Online
                                </Label>
                            </RadioGroup>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4 py-4">
                        <DialogDescription>
                            You've selected an on-site session. How would you like to pay?
                        </DialogDescription>
                        <RadioGroup onValueChange={(value: 'payNow' | 'payCash') => setPaymentMethod(value)} className="flex gap-4 mt-2">
                            <Label htmlFor="payNow" className="flex items-center gap-2 border p-3 rounded-lg cursor-pointer flex-1">
                                <RadioGroupItem value="payNow" id="payNow" />
                                Pay Now (Online)
                            </Label>
                            <Label htmlFor="payCash" className="flex items-center gap-2 border p-3 rounded-lg cursor-pointer flex-1">
                                <RadioGroupItem value="payCash" id="payCash" />
                                Pay with Cash
                            </Label>
                        </RadioGroup>
                    </div>
                )}


                <DialogFooter>
                    {step === 1 && (
                        <Button type="button" onClick={() => {
                            if (!selectedSlot) {
                                toast({ variant: "destructive", title: "Please select a slot." });
                                return;
                            }
                            if (sessionType === 'onsite') {
                                setStep(2);
                            } else {
                                handleConfirmBooking();
                            }
                        }} disabled={isLoading}>
                            {isLoading ? <Loader2 className="animate-spin" /> : 'Next'}
                        </Button>
                    )}
                    {step === 2 && (
                        <>
                            <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                            <Button type="button" onClick={handleConfirmBooking} disabled={isLoading || !paymentMethod}>
                                {isLoading ? <Loader2 className="animate-spin" /> : 'Confirm Booking'}
                            </Button>
                        </>
                    )}

                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
