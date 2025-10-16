"use client";

import { useUser } from "@/hooks/use-user";
import { Loader2, MoreHorizontal, Trash, Edit, PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, query, where, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { initializeFirebase, useMemoFirebase } from "@/firebase";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Book } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";

const { firestore } = initializeFirebase();

export default function ShopOwnerBooksPage() {
  const { user, userData, isLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
    if (!isLoading && userData && userData.role !== 'shop_owner' && userData.role !== 'admin') {
      toast({ variant: "destructive", title: "Access Denied", description: "You are not a shop owner."});
      router.push("/dashboard");
    }
  }, [user, userData, isLoading, router, toast]);

  const booksQuery = useMemoFirebase(() =>
    user ? query(
      collection(firestore, "books"),
      where("sellerId", "==", user.uid)
    ) : null,
    [user]
  );

  const { data: books, isLoading: isLoadingBooks } = useCollection<Book>(booksQuery);

  const openDeleteDialog = (book: Book) => {
    setBookToDelete(book);
    setIsDeleteDialogOpen(true);
  }

  const handleDeleteBook = async () => {
    if (!bookToDelete) return;
    try {
      // Soft delete by marking as deleted
      const bookRef = doc(firestore, "books", bookToDelete.id);
      await updateDoc(bookRef, { deleted: true });
      toast({ title: "Book Deleted", description: `${bookToDelete.title} has been removed.` });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Deletion Failed", description: error.message });
    } finally {
        setIsDeleteDialogOpen(false);
        setBookToDelete(null);
    }
  };

  if (isLoading || isLoadingBooks) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout>
        <Card>
          <CardHeader className="px-7 flex-row justify-between items-center">
            <div>
                <CardTitle>Manage My Books</CardTitle>
                <CardDescription>
                View, create, and manage your book listings.
                </CardDescription>
            </div>
            <Button asChild>
                <Link href="/shop-owner/books/new">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Book
                </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Book</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {books && books.length > 0 ? (
                  books.map((book) => (
                    <TableRow key={book.id}>
                      <TableCell className="flex items-center gap-4">
                        <Image src={book.images[0]} alt={book.title} width={40} height={50} className="rounded-sm object-cover" />
                        <div>
                            <p className="font-semibold">{book.title}</p>
                            <p className="text-xs text-muted-foreground">{book.author}</p>
                        </div>
                      </TableCell>
                      <TableCell>PKR {book.price}</TableCell>
                      <TableCell>
                        <Badge variant={book.stock > 5 ? "default" : "secondary"}>{book.stock}</Badge>
                      </TableCell>
                      <TableCell>{book.rating} ({book.reviewsCount})</TableCell>
                      <TableCell>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Toggle menu</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onSelect={() => router.push(`/shop-owner/books/edit/${book.id}`)}>
                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600" onSelect={() => openDeleteDialog(book)}>
                                    <Trash className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      You haven't listed any books yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will mark the book as deleted and hide it from the marketplace.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteBook} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </DashboardLayout>
  );
}
