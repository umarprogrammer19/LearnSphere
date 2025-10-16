"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import {
  handleEmailSignIn,
  handleGoogleSignIn,
  handleMicrosoftSignIn,
  FullUserProfile
} from "@/firebase/auth";
import { FcGoogle } from "react-icons/fc";
import { FaMicrosoft } from "react-icons/fa";
import { Loader2 } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { initializeFirebase } from "@/firebase";

const { firestore } = initializeFirebase();

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isProviderLoading, setIsProviderLoading] = useState<
    "google" | "microsoft" | null
  >(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  
  const redirectToDashboard = (role: string) => {
    if (role === 'admin') {
      router.push('/admin-dashboard');
    } else {
      router.push('/dashboard');
    }
  };

  const handleLoginSuccess = async (user: any) => {
      const userDocRef = doc(firestore, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = userDoc.data() as FullUserProfile;
        toast({ title: "Login Successful" });
        redirectToDashboard(userData.role);
      } else {
        toast({ title: "Login Successful" });
        router.push("/");
      }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const user = await handleEmailSignIn(values.email, values.password);
      await handleLoginSuccess(user);
    } catch (error: any) {
        let errorMessage = "An unknown error occurred.";
        if (error.code) {
            switch(error.code) {
                case 'auth/user-not-found':
                    errorMessage = "No user found with this email.";
                    break;
                case 'auth/wrong-password':
                    errorMessage = "Incorrect password. Please try again.";
                    break;
                case 'auth/email-not-verified':
                     errorMessage = "Please verify your email to log in. Check your inbox for a verification link.";
                     break;
                default:
                    errorMessage = error.message;
            }
        }
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleProviderSignIn(provider: "google" | "microsoft") {
    setIsProviderLoading(provider);
    try {
      const signInMethod =
        provider === "google" ? handleGoogleSignIn : handleMicrosoftSignIn;
      const user = await signInMethod();

      if (user) {
        await handleLoginSuccess(user);
      }
    } catch (error: any) {
      if (error.code !== "auth/popup-closed-by-user") {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description:
            error.message || "An unexpected error occurred during sign-in.",
        });
      }
    } finally {
      setIsProviderLoading(null);
    }
  }

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold font-headline tracking-tight">Welcome Back</h1>
        <p className="text-muted-foreground">Enter your credentials to access your account</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="email@example.com"
                      {...field}
                      disabled={isLoading || !!isProviderLoading}
                      className="h-12 rounded-xl"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center">
                    <FormLabel>Password</FormLabel>
                    <Link
                      href="/forgot-password"
                      className="ml-auto inline-block text-sm text-primary hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <FormControl>
                    <Input type="password" {...field} disabled={isLoading || !!isProviderLoading} className="h-12 rounded-xl" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button type="submit" className="w-full h-12 rounded-xl text-base" disabled={isLoading || !!isProviderLoading}>
            {isLoading ? <Loader2 className="animate-spin" /> : "Login"}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="h-12 rounded-xl text-base"
              onClick={() => handleProviderSignIn("google")}
              disabled={isLoading || !!isProviderLoading}
            >
              {isProviderLoading === "google" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FcGoogle className="mr-2 h-5 w-5" />
              )}
              Google
            </Button>
            <Button
              variant="outline"
              className="h-12 rounded-xl text-base"
              onClick={() => handleProviderSignIn("microsoft")}
              disabled={isLoading || !!isProviderLoading}
            >
              {isProviderLoading === "microsoft" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FaMicrosoft className="mr-2 h-5 w-5 text-[#00A4EF]" />
              )}
              Microsoft
            </Button>
          </div>
        </form>
      </Form>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-semibold text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
