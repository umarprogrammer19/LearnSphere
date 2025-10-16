"use client";

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Heart,
  Loader2,
  Search,
  ShoppingCart,
} from 'lucide-react';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, addDoc } from 'firebase/firestore';
import { initializeFirebase, useMemoFirebase } from '@/firebase';
import { Book } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/hooks/use-user';
import { mockBooks } from '@/lib/books-data'; // Using mock data

const { firestore } = initializeFirebase();

export default function BooksMarketplacePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [condition, setCondition] = useState('all');
  const [city, setCity] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const { toast } = useToast();
  const { user } = useUser();

  // For MVP, we will use mock data. The Firestore query is here for future use.
  // const booksQuery = useMemoFirebase(() => query(collection(firestore, "books")), []);
  // const { data: books, isLoading, error } = useCollection<Book>(booksQuery);
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching data
    const mockDataWithIds = mockBooks.map((book, index) => ({
      ...book,
      id: `mock-book-${index + 1}`
    }));
    setBooks(mockDataWithIds);
    setIsLoading(false);
  }, []);


  const filteredAndSortedBooks = useMemo(() => {
    if (!books) return [];

    let filtered = books.filter(book => {
      // Search term
      const term = searchTerm.toLowerCase();
      const titleMatch = book.title.toLowerCase().includes(term);
      const authorMatch = book.author.toLowerCase().includes(term);
      
      // Filters
      const categoryMatch = category === 'all' || book.category === category;
      const priceMatch = priceRange === 'all' || 
        (priceRange === 'under1000' && book.price < 1000) ||
        (priceRange === '1000to2000' && book.price >= 1000 && book.price <= 2000) ||
        (priceRange === 'over2000' && book.price > 2000);
      const conditionMatch = condition === 'all' || book.condition === condition;
      const cityMatch = city === 'all' || book.city === city;

      return (titleMatch || authorMatch) && categoryMatch && priceMatch && conditionMatch && cityMatch;
    });

    // Sorting
    switch (sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
        break;
    }

    return filtered;
  }, [books, searchTerm, category, priceRange, condition, city, sortBy]);
  
  const handleAddToCart = async (book: Book) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Please log in to add items to your cart.' });
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


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto py-12 px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold font-headline">Books Marketplace</h1>
          <p className="text-lg text-muted-foreground mt-2">Find your next favorite read.</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 p-4 bg-card rounded-xl shadow-sm">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by title or author..."
              className="pl-10 h-12 rounded-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Fiction">Fiction</SelectItem>
                <SelectItem value="Thriller">Thriller</SelectItem>
                <SelectItem value="Self-Help">Self-Help</SelectItem>
                <SelectItem value="History">History</SelectItem>
                <SelectItem value="Classic">Classic</SelectItem>
                 <SelectItem value="Sci-Fi">Sci-Fi</SelectItem>
                <SelectItem value="Finance">Finance</SelectItem>
                <SelectItem value="Biography">Biography</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priceRange} onValueChange={setPriceRange}>
              <SelectTrigger><SelectValue placeholder="Price Range" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="under1000">Under PKR 1000</SelectItem>
                <SelectItem value="1000to2000">PKR 1000 - 2000</SelectItem>
                <SelectItem value="over2000">Over PKR 2000</SelectItem>
              </SelectContent>
            </Select>
             <Select value={condition} onValueChange={setCondition}>
              <SelectTrigger><SelectValue placeholder="Condition" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Conditions</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="used">Used</SelectItem>
              </SelectContent>
            </Select>
             <Select value={city} onValueChange={setCity}>
              <SelectTrigger><SelectValue placeholder="City" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                <SelectItem value="Karachi">Karachi</SelectItem>
                <SelectItem value="Lahore">Lahore</SelectItem>
                <SelectItem value="Islamabad">Islamabad</SelectItem>
                <SelectItem value="Peshawar">Peshawar</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger><SelectValue placeholder="Sort By" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Book Listings */}
        {isLoading ? (
          <div className="flex justify-center mt-8">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {filteredAndSortedBooks.map((book) => (
              <Card key={book.id} className="flex flex-col rounded-xl shadow-md hover:shadow-xl transition-shadow overflow-hidden">
                <Link href={`/books/${book.id}`} className="block">
                  <div className="relative aspect-[3/4]">
                    <Image
                      src={book.images[0] || 'https://placehold.co/600x800'}
                      alt={book.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                     <Badge className="absolute top-2 right-2 capitalize">{book.condition}</Badge>
                  </div>
                </Link>
                <CardContent className="p-4 flex-grow">
                  <h3 className="font-bold truncate">{book.title}</h3>
                  <p className="text-sm text-muted-foreground">{book.author}</p>
                  <p className="text-lg font-bold text-primary mt-2">PKR {book.price}</p>
                </CardContent>
                <CardFooter className="p-2 border-t">
                  <div className="flex w-full gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleAddToCart(book)}>
                      <ShoppingCart className="mr-2 h-4 w-4" /> Cart
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleAddToWishlist(book)}>
                      <Heart className="h-5 w-5 text-muted-foreground hover:fill-red-500 hover:text-red-500" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
        {!isLoading && filteredAndSortedBooks.length === 0 && (
          <p className="text-center text-muted-foreground mt-8">No books found matching your criteria.</p>
        )}
      </main>
      <Footer />
    </div>
  );
}
