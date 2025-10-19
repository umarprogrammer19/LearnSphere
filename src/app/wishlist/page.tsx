"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Trash2, ShoppingCart } from 'lucide-react';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { initializeFirebase, useMemoFirebase } from '@/firebase';
import { useUser } from '@/hooks/use-user';
import { WishlistItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const { firestore } = initializeFirebase();

export default function WishlistPage() {
  const { user, isLoading: isUserLoading } = useUser();
  const { toast } = useToast();

  const wishlistQuery = useMemoFirebase(
    () => (user ? collection(firestore, `wishlists/${user.uid}/items`) : null),
    [user]
  );
  const { data: wishlistItems, isLoading: isWishlistLoading } = useCollection<WishlistItem>(wishlistQuery);

  const handleRemoveItem = async (itemId: string) => {
    if (!user) return;
    const itemRef = doc(firestore, `wishlists/${user.uid}/items`, itemId);
    try {
      await deleteDoc(itemRef);
      toast({ title: "Item removed from wishlist." });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const handleMoveToCart = async (item: WishlistItem) => {
    if (!user) return;
    try {
      // Add to cart
      const cartRef = collection(firestore, `carts/${user.uid}/items`);
      await addDoc(cartRef, {
        id: item.id,
        title: item.title,
        price: item.price,
        image: item.image,
        quantity: 1,
      });

      // Remove from wishlist
      const itemRef = doc(firestore, `wishlists/${user.uid}/items`, item.id);
      await deleteDoc(itemRef);

      // Show toast success
      toast({ title: 'Moved to cart!', description: `${item.title} has been moved to your cart.` });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };


  if (isUserLoading || isWishlistLoading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin" /></div>;
  }

  if (!user) {
    return <div className="flex min-h-screen items-center justify-center"><p>Please log in to view your wishlist.</p></div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto py-12 px-4">
        <Card className="max-w-4xl mx-auto shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle className="text-3xl font-bold font-headline">My Wishlist</CardTitle>
            <CardDescription>Your collection of saved books.</CardDescription>
          </CardHeader>
          <CardContent>
            {wishlistItems && wishlistItems.length > 0 ? (
              <div className="space-y-4">
                {wishlistItems.map(item => (
                  <div key={item.id} className="flex items-center gap-4 border-b pb-4">
                    <div className="relative h-24 w-20 flex-shrink-0">
                      <Image src={item.image} alt={item.title} fill className="object-cover rounded-md" />
                    </div>
                    <div className="flex-grow">
                      <h3 className="font-semibold">{item.title}</h3>
                      <p className="text-lg font-bold text-primary">PKR {item.price}</p>
                    </div>
                    <div className="flex gap-2">
                       <Button variant="outline" size="sm" onClick={() => handleMoveToCart(item)}>
                        <ShoppingCart className="mr-2 h-4 w-4" /> Move to Cart
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)}>
                        <Trash2 className="h-5 w-5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <h2 className="text-2xl font-semibold">Your wishlist is empty</h2>
                <p className="text-muted-foreground mt-2">Add books you love to your wishlist.</p>
                <Button asChild className="mt-6 rounded-xl">
                  <Link href="/books">Explore Books</Link>
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
