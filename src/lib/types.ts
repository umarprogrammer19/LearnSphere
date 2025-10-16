import { Timestamp } from 'firebase/firestore';

// Represents the core data for a book listing in the marketplace.
export type Book = {
  id: string; // Document ID
  title: string;
  author: string;
  description: string;
  category: string;
  condition: 'new' | 'used';
  price: number;
  currency: 'PKR';
  stock: number;
  images: string[];
  sellerId: string;
  sellerShopId?: string;
  sellerName: string;

  city: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  rating: number;
  reviewsCount: number;
};

// Represents an item within a user's shopping cart.
export type CartItem = {
  id: string; // Corresponds to Book ID
  title: string;
  price: number;
  image: string;
  quantity: number;
  stock: number;
};

// Represents an item in a user's wishlist.
export type WishlistItem = {
  id: string; // Corresponds to Book ID
  title: string;
  price: number;
  image: string;
};

// Represents a customer's order.
export type Order = {
  id: string; // Document ID
  userId: string;
  items: CartItem[];
  totalAmount: number;
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    country: string;
    postalCode: string;
  };
  paymentMethod: 'stripe' | 'cod';
  paymentStatus: 'pending' | 'paid' | 'failed';
  orderStatus: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  stripeSessionId?: string;
};
