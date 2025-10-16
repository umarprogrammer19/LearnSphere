"use client";

import { useUser } from "@/hooks/use-user";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { initializeFirebase } from "@/firebase";
import { storage } from "@/firebase/config";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useState } from "react";

const { firestore } = initializeFirebase();

const bookFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters."),
  author: z.string().min(3, "Author name is required."),
  description: z.string().min(20, "Description must be at least 20 characters."),
  category: z.string().min(1, "Please select a category."),
  condition: z.enum(["new", "used"], { required_error: "Condition is required." }),
  price: z.coerce.number().min(1, "Price must be a positive number."),
  stock: z.coerce.number().int().min(0, "Stock can't be negative."),
  city: z.string().min(2, "City is required."),
  images: z.any(),
});


export default function NewBookPage() {
  const { user, userData, isLoading: isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const form = useForm<z.infer<typeof bookFormSchema>>({
    resolver: zodResolver(bookFormSchema),
    defaultValues: {
      title: "",
      author: "",
      description: "",
      price: 0,
      stock: 1,
      city: userData?.city || "",
    },
  });

  useEffect(() => {
    if (!isUserLoading && (!user || (userData && userData.role !== 'shop_owner' && userData.role !== 'admin'))) {
      toast({ variant: "destructive", title: "Access Denied" });
      router.push("/dashboard");
    }
  }, [user, userData, isUserLoading, router, toast]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImageFiles(Array.from(e.target.files));
    }
  };

  const handleFormSubmit = async (values: z.infer<typeof bookFormSchema>) => {
    if (!user) return;
    if (imageFiles.length === 0) {
        toast({ variant: "destructive", title: "Please upload at least one image."});
        return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
        const imageUrls: string[] = [];
        for (let i = 0; i < imageFiles.length; i++) {
            const file = imageFiles[i];
            const storageRef = ref(storage, `books/${user.uid}/${Date.now()}-${file.name}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            imageUrls.push(url);
            setUploadProgress(((i + 1) / imageFiles.length) * 100);
        }

      const bookData = {
        ...values,
        images: imageUrls,
        sellerId: user.uid,
        sellerName: userData?.shopName || `${userData?.firstName} ${userData?.lastName}`,
        rating: 0,
        reviewsCount: 0,
        currency: "PKR",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(firestore, "books"), bookData);

      toast({ title: "Book listed successfully!", description: `${values.title} is now live on the marketplace.` });
      router.push('/shop-owner/books');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  if (isUserLoading || !user) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin" /></div>;
  }
  
  return (
    <DashboardLayout>
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>List a New Book</CardTitle>
          <CardDescription>Fill in the details below to add a new book to your shop.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
              <FormField name="title" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField name="author" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Author</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField name="description" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} rows={5} /></FormControl><FormMessage /></FormItem>
              )}/>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField name="category" control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>Category</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl><SelectContent>
                        <SelectItem value="Fiction">Fiction</SelectItem><SelectItem value="Thriller">Thriller</SelectItem><SelectItem value="Self-Help">Self-Help</SelectItem><SelectItem value="History">History</SelectItem><SelectItem value="Classic">Classic</SelectItem><SelectItem value="Sci-Fi">Sci-Fi</SelectItem><SelectItem value="Finance">Finance</SelectItem><SelectItem value="Biography">Biography</SelectItem>
                    </SelectContent></Select><FormMessage /></FormItem>
                )}/>
                 <FormField name="condition" control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>Condition</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select condition" /></SelectTrigger></FormControl><SelectContent>
                        <SelectItem value="new">New</SelectItem><SelectItem value="used">Used</SelectItem>
                    </SelectContent></Select><FormMessage /></FormItem>
                )}/>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <FormField name="price" control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>Price (PKR)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField name="stock" control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>Stock</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField name="city" control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
              </div>
               <FormField name="images" control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>Book Images</FormLabel><FormControl><Input type="file" multiple accept="image/*" onChange={handleImageChange} /></FormControl><FormDescription>You can upload multiple images.</FormDescription><FormMessage /></FormItem>
                )}/>
                
                {isSubmitting && uploadProgress !== null && (
                    <div className="w-full bg-muted rounded-full h-2.5">
                        <div className="bg-primary h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                )}

              <Button type="submit" disabled={isSubmitting} className="w-full rounded-xl">
                {isSubmitting ? <Loader2 className="animate-spin" /> : 'List Book'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
