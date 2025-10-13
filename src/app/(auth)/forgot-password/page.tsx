import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-3xl font-bold font-headline">Forgot Password?</CardTitle>
        <CardDescription>
          No problem! Enter your email below and we&apos;ll send you a reset link.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            required
          />
        </div>
        <Button type="submit" className="w-full">
          Send Reset Link
        </Button>
      </CardContent>
      <CardFooter className="text-center text-sm">
        Remembered your password?{" "}
        <Link href="/login" className="underline ml-1">
          Back to Login
        </Link>
      </CardFooter>
    </Card>
  );
}
