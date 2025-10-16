"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, doc, addDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { initializeFirebase, useMemoFirebase } from '@/firebase';
import { useUser } from '@/hooks/use-user';
import { CartItem, Order } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { loadStripe } from '@stripe/stripe-js';

const { firestore } = initializeFirebase();
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

const shippingFormSchema = z.object({
    name: z.string().min(2, "Name is required."),
    address: z.string().min(5, "Address is required."),
    city: z.string().min(2, "City is required."),
    country: z.string().min(2, "Country is required."),
    postalCode: z.string().min(5, "Postal code is required."),
    paymentMethod: z.enum(["stripe", "cod"], { required_error: "Please select a payment method." }),
});

export default function CheckoutPage() {
    const { user, userData } = useUser();
    const router = useRouter();
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);

    const cartQuery = useMemoFirebase(() => user ? collection(firestore, `carts/${user.uid}/items`) : null, [user]);
    const { data: cartItems } = useCollection<CartItem>(cartQuery);

    const subtotal = useMemo(() => cartItems?.reduce((acc, item) => acc + item.price * item.quantity, 0) || 0, [cartItems]);
    const total = subtotal + 250; // Assuming fixed shipping

    const form = useForm<z.infer<typeof shippingFormSchema>>({
        resolver: zodResolver(shippingFormSchema),
        defaultValues: {
            paymentMethod: "stripe",
        },
    });
    
    useEffect(() => {
        if (userData) {
            form.reset({
                name: `${userData.firstName} ${userData.lastName}`,
                address: userData.address || '',
                city: userData.city || '',
                country: userData.country || 'Pakistan',
                postalCode: userData.postalCode || '',
                paymentMethod: 'stripe',
            })
        }
    }, [userData, form]);

    const handlePlaceOrder = async (values: z.infer<typeof shippingFormSchema>) => {
        if (!user || !cartItems || cartItems.length === 0) {
            toast({ variant: "destructive", title: "Your cart is empty." });
            return;
        }

        setIsProcessing(true);

        try {
            // 1. Create Order document
            const orderData: Omit<Order, 'id'> = {
                userId: user.uid,
                items: cartItems,
                totalAmount: total,
                shippingAddress: {
                    name: values.name,
                    address: values.address,
                    city: values.city,
                    country: values.country,
                    postalCode: values.postalCode
                },
                paymentMethod: values.paymentMethod,
                paymentStatus: 'pending',
                orderStatus: 'pending',
                createdAt: serverTimestamp() as any,
                updatedAt: serverTimestamp() as any,
            };

            const newOrderRef = await addDoc(collection(firestore, "orders"), orderData);

            // 2. Process payment
            if (values.paymentMethod === 'stripe') {
                const res = await fetch('/api/stripe/create-checkout-session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        orderId: newOrderRef.id,
                        amount: total,
                        customerName: values.name,
                    }),
                });

                if (!res.ok) throw new Error('Failed to create Stripe session.');
                
                const { sessionId } = await res.json();
                const stripe = await stripePromise;
                if(stripe) {
                    const { error } = await stripe.redirectToCheckout({ sessionId });
                    if (error) throw new Error(error.message);
                }
            } else { // Cash on Delivery
                // Update order status for COD
                 await runTransaction(firestore, async (transaction) => {
                    // Update order
                    transaction.update(newOrderRef, { orderStatus: "confirmed", paymentStatus: "pending" });

                    // Clear cart
                    cartItems.forEach(item => {
                        const cartItemRef = doc(firestore, `carts/${user.uid}/items`, item.id);
                        transaction.delete(cartItemRef);
                    });
                });
                toast({ title: "Order Placed!", description: "Your order has been placed successfully." });
                router.push('/orders');
            }

        } catch (error: any) {
            toast({ variant: "destructive", title: "Order Failed", description: error.message });
            setIsProcessing(false);
        }
    };


    if (!cartItems) {
        return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin" /></div>;
    }

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <Header />
            <main className="flex-grow container mx-auto py-12 px-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Shipping Details */}
                    <div>
                        <h1 className="text-3xl font-bold font-headline mb-6">Shipping Details</h1>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(handlePlaceOrder)} className="space-y-6">
                                <FormField control={form.control} name="name" render={({ field }) => (
                                    <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="address" render={({ field }) => (
                                    <FormItem><FormLabel>Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="city" render={({ field }) => (
                                    <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="postalCode" render={({ field }) => (
                                    <FormItem><FormLabel>Postal Code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                </div>
                                <FormField control={form.control} name="country" render={({ field }) => (
                                     <FormItem><FormLabel>Country</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>

                                <h2 className="text-2xl font-bold font-headline pt-6">Payment Method</h2>
                                <FormField control={form.control} name="paymentMethod" render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                                            <Label htmlFor="stripe" className="flex items-center gap-2 border p-4 rounded-lg cursor-pointer flex-1 data-[state=checked]:border-primary">
                                                <RadioGroupItem value="stripe" id="stripe" />
                                                Pay with Card (Stripe)
                                            </Label>
                                            <Label htmlFor="cod" className="flex items-center gap-2 border p-4 rounded-lg cursor-pointer flex-1 data-[state=checked]:border-primary">
                                                <RadioGroupItem value="cod" id="cod" />
                                                Cash on Delivery
                                            </Label>
                                        </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                 <Button type="submit" size="lg" className="w-full rounded-xl" disabled={isProcessing}>
                                    {isProcessing ? <Loader2 className="animate-spin" /> : 'Place Order'}
                                </Button>
                            </form>
                        </Form>
                    </div>

                    {/* Order Summary */}
                    <div>
                         <Card className="bg-muted/50 rounded-xl sticky top-24">
                            <CardHeader>
                                <CardTitle className="text-2xl">Your Order</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {cartItems.map(item => (
                                    <div key={item.id} className="flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold">{item.title} <span className="text-sm text-muted-foreground">x{item.quantity}</span></p>
                                        </div>
                                        <p>PKR {item.price * item.quantity}</p>
                                    </div>
                                ))}
                                <Separator />
                                <div className="flex justify-between"><span>Subtotal</span><span>PKR {subtotal}</span></div>
                                <div className="flex justify-between"><span>Shipping</span><span>PKR 250</span></div>
                                <Separator />
                                <div className="flex justify-between font-bold text-lg"><span>Total</span><span>PKR {total}</span></div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
