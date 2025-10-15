"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
import { useToast } from "@/hooks/use-toast";
import {
  startPhoneSignIn,
  confirmOtp,
  getRecaptchaVerifier,
} from "@/firebase/auth";
import { ConfirmationResult } from "firebase/auth";
import { Loader2 } from "lucide-react";

export default function VerifyOtpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const [confirmationResult, setConfirmationResult] =
    useState<ConfirmationResult | null>(null);
  
  const phoneNumber = searchParams.get("phone") || "";

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (phoneNumber && !window.confirmationResult) {
      handleSendOtp();
    } else if (window.confirmationResult) {
        setConfirmationResult(window.confirmationResult as ConfirmationResult);
    }
  }, [phoneNumber]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0 && isResending) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
     if(cooldown === 0) setIsResending(false)
    return () => clearTimeout(timer);
  }, [cooldown, isResending]);

  const handleSendOtp = async (isResend = false) => {
    if (!phoneNumber) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Phone number not provided.",
      });
      router.push("/signup");
      return;
    }
    if (isResend) {
      setIsResending(true);
    } else {
      setIsLoading(true);
    }

    try {
      const verifier = getRecaptchaVerifier("recaptcha-container");
      const result = await startPhoneSignIn(phoneNumber, verifier);
      setConfirmationResult(result);
      window.confirmationResult = result;
      toast({ title: "OTP Sent", description: `A code has been sent to ${phoneNumber}` });
      setCooldown(60);
    } catch (error: any) {
        let friendlyMessage = "An unknown error occurred.";
        if(error.code === 'auth/invalid-phone-number'){
            friendlyMessage = "Invalid phone number format. Please enter a valid number (e.g., +1234567890)."
        } else {
            friendlyMessage = error.message;
        }
      toast({
        variant: "destructive",
        title: "Failed to send OTP",
        description: friendlyMessage,
      });
       if (isResend) setIsResending(false);
    } finally {
      if (!isResend) {
        setIsLoading(false);
      }
    }
  };
  
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const { value } = e.target;
    if (/^[0-9]$/.test(value) || value === "") {
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
        }
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").slice(0, 6);
    if (pasteData.length === 6 && /^\d+$/.test(pasteData)) {
      const newOtp = pasteData.split("");
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
    }
  };
  
  const handleSubmit = async () => {
    const code = otp.join("");
    if (code.length !== 6) {
      toast({
        variant: "destructive",
        title: "Invalid OTP",
        description: "Please enter the complete 6-digit code.",
      });
      return;
    }
    if (!confirmationResult) {
        toast({
            variant: "destructive",
            title: "Verification Expired",
            description: "Please request a new OTP code.",
        });
        return;
    }
    setIsLoading(true);
    try {
      await confirmOtp(confirmationResult, code);
      toast({ title: "Phone Verified", description: "Your phone number has been successfully verified." });
      router.push("/");
    } catch (error: any) {
      let friendlyMessage = "An unknown error occurred.";
      switch (error.code) {
          case "auth/invalid-verification-code":
              friendlyMessage = "The verification code is invalid. Please try again.";
              break;
          case "auth/missing-verification-code":
              friendlyMessage = "Please enter the 6-digit OTP.";
              break;
          case "auth/too-many-requests":
              friendlyMessage = "Too many requests. Please try again later.";
              break;
          case "auth/captcha-check-failed":
              friendlyMessage = "reCAPTCHA check failed. Please refresh and try again.";
              break;
          default:
            friendlyMessage = error.message;
            break;
      }
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: friendlyMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-3xl font-bold font-headline">
          Check your Phone
        </CardTitle>
        <CardDescription>
          We&apos;ve sent a 6-digit code to {phoneNumber}. Enter it below.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div
          className="flex justify-center gap-2"
          onPaste={handlePaste}
        >
          {otp.map((digit, index) => (
            <Input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              className="w-12 h-12 text-center text-xl"
              maxLength={1}
              value={digit}
              onChange={(e) => handleInputChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              disabled={isLoading}
            />
          ))}
        </div>
        <Button onClick={handleSubmit} className="w-full" disabled={isLoading || isResending}>
          {isLoading ? <Loader2 className="animate-spin" /> : "Verify"}
        </Button>
        <div id="recaptcha-container" className="flex justify-center"></div>
      </CardContent>
      <CardFooter className="flex flex-col items-center text-center text-sm text-muted-foreground">
        <span>Didn&apos;t receive a code?</span>
        <Button
          variant="link"
          className="p-0 h-auto"
          onClick={() => handleSendOtp(true)}
          disabled={cooldown > 0 || isResending}
        >
          {isResending ? <Loader2 className="animate-spin" /> : (cooldown > 0 && isResending ? `Resend in ${cooldown}s` : "Resend Code")}
        </Button>
      </CardFooter>
    </Card>
  );
}

declare global {
  interface Window {
    recaptchaVerifier?: any;
    confirmationResult?: ConfirmationResult;
  }
}

    