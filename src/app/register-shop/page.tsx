"use client";

import { useUser } from "@/hooks/use-user";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { initializeFirebase } from "@/firebase";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { GoogleMap } from "@/components/google-map";

const { firestore } = initializeFirebase();

const shopFormSchema = z.object({
  shopName: z.string().min(2, "Shop name must be at least 2 characters."),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    formattedAddress: z.string().optional(),
    placeName: z.string().optional(),
  }),
});

export default function RegisterShopPage() {
  const { user, userData, isLoading: isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | undefined>(undefined);

  const shopForm = useForm<z.infer<typeof shopFormSchema>>({
    resolver: zodResolver(shopFormSchema),
    defaultValues: {
      shopName: "",
    },
  });

  useEffect(() => {
    if (!isUserLoading && !user) {
      toast({ title: "Please log in", description: "You need to be logged in to register a shop.", variant: "destructive" });
      router.push("/login");
    }
  }, [user, isUserLoading, router, toast]);

  const handleShopFormSubmit = async (values: z.infer<typeof shopFormSchema>) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const userRef = doc(firestore, "users", user.uid);
      await setDoc(
        userRef,
        {
          role: "shop_owner",
          shopName: values.shopName,
          shopLocation: { 
            latitude: values.location.lat, 
            longitude: values.location.lng,
            formattedAddress: values.location.formattedAddress,
            placeName: values.location.placeName
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      toast({ title: "🎉 Congratulations!", description: "You are now a Shop Owner. You can start listing your books." });
      router.push('/shop-owner/books');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMapLocationChange = (location: { lat: number; lng: number, formattedAddress?: string, placeName?: string }) => {
    setCurrentLocation({lat: location.lat, lng: location.lng});
    shopForm.setValue("location", location, { shouldValidate: true });
  };
  
  if (isUserLoading || !user) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }

  return (
    <>
      <Header />
      <main className="container mx-auto py-12 px-4">
        <Card className="max-w-2xl mx-auto shadow-lg">
          <CardHeader>
            <CardTitle>Register Your Bookshop</CardTitle>
            <CardDescription>Fill out the form below to become a seller on LearnSphere.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...shopForm}>
              <form
                onSubmit={shopForm.handleSubmit(handleShopFormSubmit)}
                className="space-y-8"
              >
                <FormField
                  control={shopForm.control}
                  name="shopName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shop Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Karachi Book Emporium" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <FormLabel>Shop Location</FormLabel>
                  <p className="text-sm text-muted-foreground">Search for your shop address or drag the pin on the map.</p>
                  <div className="h-[400px] w-full rounded-lg overflow-hidden border">
                    <GoogleMap
                      onLocationChange={handleMapLocationChange}
                      initialCenter={currentLocation}
                      isDraggable={true}
                      showSearchBox={true}
                    />
                  </div>
                  {shopForm.formState.errors.location && <FormMessage>{shopForm.formState.errors.location.message}</FormMessage>}
                </div>
                
                <Button type="submit" disabled={isSubmitting} className="w-full rounded-xl">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : "Register as Shop Owner"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </>
  );
}
