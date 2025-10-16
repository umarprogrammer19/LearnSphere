"use client";

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Loader2, ShoppingCart, Heart, Star, CheckCircle } from 'lucide-react';
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc, collection, addDoc } from 'firebase/firestore';
import { initializeFirebase, useMemoFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/hooks/use-user';
import { Book } from '@/lib/types';
import { mockBooks } from '@/lib/books-data';

const { firestore } = initializeFirebase();

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const { toast } = useToast();
  const { user } = useUser();

  // In a real app, you would fetch the specific book. For MVP, we find it from mock data.
  const book = useMemo(() => {
    const mockId = Array.isArray(id) ? id[0] : id;
    const bookData = mockBooks.find((_, index) => `mock-book-${index + 1}` === mockId);
    if (bookData) {
      return { ...bookData, id: mockId } as Book;
    }
    return null;
  }, [id]);

  const isLoading = false; // No loading for mock data

  const handleAddToCart = async (book: Book) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Please log in to add items to your cart.' });
      router.push('/login');
      return;
    }
    try {
      const cartRef = collection(firestore, `carts/${user.uid}/items`);
      await addDoc(cartRef, {
        id: book.id,
        title: book.title,
        price: book.price,
        image: book.images[0],
        quantity: 1,
        stock: book.stock,
      });
      toast({ title: 'Added to cart!', description: `${book.title} has been added to your cart.` });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const handleAddToWishlist = async (book: Book) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Please log in to add items to your wishlist.' });
       router.push('/login');
      return;
    }
     try {
      const wishlistRef = collection(firestore, `wishlists/${user.uid}/items`);
      await addDoc(wishlistRef, {
        id: book.id,
        title: book.title,
        price: book.price,
        image: book.images[0],
      });
      toast({ title: 'Added to wishlist!', description: `${book.title} has been added to your wishlist.` });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };


  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin" /></div>;
  }

  if (!book) {
    return <div className="flex min-h-screen items-center justify-center"><p>Book not found.</p></div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto py-12 px-4">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Carousel */}
          <div>
            <Carousel className="w-full max-w-md mx-auto">
              <CarouselContent>
                {book.images.map((img, index) => (
                  <CarouselItem key={index}>
                    <div className="aspect-[3/4] relative">
                      <Image src={img} alt={`${book.title} - image ${index + 1}`} fill className="object-cover rounded-xl shadow-lg" />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-2" />
              <CarouselNext className="right-2" />
            </Carousel>
          </div>

          {/* Book Details */}
          <div className="flex flex-col space-y-6">
            <div>
              <Badge variant="secondary">{book.category}</Badge>
              <h1 className="text-4xl font-bold font-headline mt-2">{book.title}</h1>
              <p className="text-xl text-muted-foreground mt-1">by {book.author}</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-5 w-5 ${i < Math.floor(book.rating) ? 'text-accent fill-accent' : 'text-gray-300'}`} />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">({book.reviewsCount} reviews)</span>
            </div>

            <p className="text-3xl font-bold text-primary">PKR {book.price}</p>
            
            <p className="text-base text-foreground/80 leading-relaxed">{book.description}</p>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="font-semibold">Condition:</span> <Badge variant="outline" className="capitalize">{book.condition}</Badge></div>
                <div><span className="font-semibold">Stock:</span> {book.stock > 0 ? <span className="text-green-600">{book.stock} available</span> : <span className="text-destructive">Out of stock</span>}</div>
                <div><span className="font-semibold">Seller:</span> {book.sellerName}</div>
                <div><span className="font-semibold">City:</span> {book.city}</div>
            </div>

            <Separator />
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="flex-1 rounded-xl" onClick={() => handleAddToCart(book)} disabled={book.stock <= 0}>
                <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
              </Button>
               <Button size="lg" variant="outline" className="flex-1 rounded-xl">
                Buy Now
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full" onClick={() => handleAddToWishlist(book)}>
                <Heart className="h-6 w-6 text-muted-foreground hover:fill-red-500 hover:text-red-500" />
              </Button>
            </div>
             {book.stock <= 0 && <p className="text-sm text-center text-destructive">This book is currently out of stock.</p>}

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
