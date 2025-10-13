"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
    <path d="M12 15a6 6 0 0 0 4.243-1.757l2.121-2.122a2 2 0 0 0 0-2.828l-2.121-2.122A6 6 0 0 0 12 6V3.5" />
    <path d="M12 15v2.5" />
    <path d="M16.243 8.757 12 13" />
    <path d="m7.757 8.757 4.243 4.243" />
  </svg>
);

const MicrosoftIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="currentColor"
    {...props}
  >
    <path d="M11.5 22.5H2.5v-9h9v9zm0-11h-9v-9h9v9zm11 11h-9v-9h9v9zm0-11h-9v-9h9v9z"/>
  </svg>
);


export default function LoginPage() {
  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-3xl font-bold font-headline">Welcome Back</CardTitle>
        <CardDescription>Enter your credentials to access your account</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="m@example.com" required />
        </div>
        <div className="space-y-2">
          <div className="flex items-center">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="ml-auto inline-block text-sm underline"
            >
              Forgot your password?
            </Link>
          </div>
          <Input id="password" type="password" required />
        </div>
        <Button type="submit" className="w-full">
          Login
        </Button>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Button variant="outline">
            <GoogleIcon className="mr-2 h-4 w-4" />
            Google
          </Button>
          <Button variant="outline">
            <MicrosoftIcon className="mr-2 h-4 w-4" />
            Microsoft
          </Button>
        </div>
      </CardContent>
      <CardFooter className="text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="underline ml-1">
          Sign up
        </Link>
      </CardFooter>
    </Card>
  );
}
