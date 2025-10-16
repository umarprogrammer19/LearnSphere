"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Loader2, Trash2 } from 'lucide-react';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { initializeFirebase, useMemoFirebase } from '@/firebase';
import { useUser } from '@/hooks/use-user';
import { CartItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const { firestore } = initializeFirebase();

export default function CartPage() {
  const { user, isLoading: isUserLoading } = useUser();
  const { toast } = useToast();

  const cartQuery = useMemoFirebase(
    () => (user ? collection(firestore, `carts/${user.uid}/items`) : null),
    [user]
  );
  const { data: cartItems, isLoading: isCartLoading } = useCollection<CartItem>(cartQuery);

  const subtotal = useMemo(() => {
    return cartItems?.reduce((acc, item) => acc + item.price * item.quantity, 0) || 0;
  }, [cartItems]);

  const handleQuantityChange = async (itemId: string, newQuantity: number, stock: number) => {
    if (!user) return;
    if (newQuantity < 1) return;
    if (newQuantity > stock) {
        toast({
            variant: "destructive",
            title: "Stock limit reached",
            description: `Only ${stock} items are available.`,
        });
        return;
    }

    const itemRef = doc(firestore, `carts/${user.uid}/items`, itemId);
    try {
        await updateDoc(itemRef, { quantity: newQuantity });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!user) return;
    const itemRef = doc(firestore, `carts/${user.uid}/items`, itemId);
    try {
        await deleteDoc(itemRef);
        toast({ title: "Item removed from cart." });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  if (isUserLoading || isCartLoading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin" /></div>;
  }

  if (!user) {
    return <div className="flex min-h-screen items-center justify-center"><p>Please log in to view your cart.</p></div>;
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto py-12 px-4">
        <Card className="max-w-4xl mx-auto shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle className="text-3xl font-bold font-headline">Your Shopping Cart</CardTitle>
          </CardHeader>
          <CardContent>
            {cartItems && cartItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Cart Items */}
                <div className="md:col-span-2 space-y-4">
                  {cartItems.map(item => (
                    <div key={item.id} className="flex items-center gap-4 border-b pb-4">
                      <div className="relative h-24 w-20 flex-shrink-0">
                        <Image src={item.image} alt={item.title} fill className="object-cover rounded-md"/>
                      </div>
                      <div className="flex-grow">
                        <h3 className="font-semibold">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">PKR {item.price}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input 
                            type="number" 
                            className="w-16 h-9" 
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value), item.stock)}
                            min="1"
                            max={item.stock}
                        />
                      </div>
                      <p className="font-semibold w-24 text-right">PKR {item.price * item.quantity}</p>
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)}>
                        <Trash2 className="h-5 w-5 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Order Summary */}
                <div className="md:col-span-1">
                  <Card className="bg-muted/50 rounded-xl">
                    <CardHeader>
                      <CardTitle>Order Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                       <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>PKR {subtotal}</span>
                      </div>
                       <div className="flex justify-between">
                        <span>Shipping</span>
                        <span>PKR 250</span>
                      </div>
                      <Separator />
                       <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>PKR {subtotal + 250}</span>
                      </div>
                    </CardContent>
                    <CardFooter>
                       <Button asChild className="w-full rounded-xl" size="lg">
                            <Link href="/checkout">Proceed to Checkout</Link>
                        </Button>
                    </CardFooter>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <h2 className="text-2xl font-semibold">Your cart is empty</h2>
                <p className="text-muted-foreground mt-2">Looks like you haven't added any books yet.</p>
                <Button asChild className="mt-6 rounded-xl">
                  <Link href="/books">Start Shopping</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
