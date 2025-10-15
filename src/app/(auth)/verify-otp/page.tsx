
"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
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
import { ConfirmationResult, RecaptchaVerifier } from "firebase/auth";
import { Loader2 } from "lucide-react";

export default function VerifyOtpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  
  const phoneNumber = searchParams.get("phone") || "";

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // --- Start of robust state management for Firebase objects ---
  const confirmationResultRef = useRef<ConfirmationResult | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const recaptchaWrapperRef = useRef<HTMLDivElement>(null);
  // --- End of robust state management ---


  const handleAuthError = useCallback((error: any, title: string) => {
    let friendlyMessage = "An unknown error occurred. Please try again.";
      if(error.code === 'auth/invalid-phone-number'){
          friendlyMessage = "Invalid phone number format. Please enter a valid +92 number."
      } else if (error.code === 'auth/internal-error' || error.code === 'auth/invalid-app-credential') {
          friendlyMessage = "An internal authentication error occurred. Please check your Firebase project's configuration."
      } else if (error.message && error.message.includes('reCAPTCHA')) {
          friendlyMessage = "reCAPTCHA validation failed. Please refresh the page and try again."
      } else if (error.code === 'auth/too-many-requests') {
          friendlyMessage = "Too many requests. Please wait a few minutes before trying again."
      }
      else {
          friendlyMessage = error.message;
      }
    toast({
      variant: "destructive",
      title: title,
      description: friendlyMessage,
    });
    // Reset state on error to allow retry
    setIsLoading(false);
    setIsResending(false);
    setCooldown(0);
  }, [toast]);


  const sendOtp = useCallback(async () => {
    setIsLoading(true);
    setIsResending(true); // Disable resend button

    if (!phoneNumber) {
        toast({ variant: "destructive", title: "Error", description: "Phone number not provided." });
        router.push("/signup");
        setIsLoading(false);
        return;
    }

    try {
      // Ensure the container is visible for reCAPTCHA
      if (recaptchaWrapperRef.current) {
        recaptchaWrapperRef.current.innerHTML = `<div id="recaptcha-container"></div>`;
      }
      
      const verifier = getRecaptchaVerifier("recaptcha-container");
      recaptchaVerifierRef.current = verifier;

      const confirmationResult = await startPhoneSignIn(phoneNumber, verifier);
      confirmationResultRef.current = confirmationResult;
      
      toast({ title: "OTP Sent", description: `A code has been sent to ${phoneNumber}` });
      setCooldown(60); // Start cooldown after successful send
    } catch (error: any) {
      handleAuthError(error, "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  }, [phoneNumber, toast, router, handleAuthError]);


  // Effect to send OTP only once on initial load
  useEffect(() => {
    sendOtp();
  }, [sendOtp]);

  // Effect for cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
        setIsResending(false); // Enable resend button when cooldown is over
    }
  }, [cooldown]);


  const handleResendOtp = async () => {
    if (isResending) return;
    // We just call sendOtp again, which now correctly handles re-initialization
    await sendOtp();
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
    
    const activeConfirmationResult = confirmationResultRef.current;

    if (!activeConfirmationResult) {
        toast({
            variant: "destructive",
            title: "Verification Expired",
            description: "Please request a new OTP code.",
        });
        return;
    }
    setIsLoading(true);
    try {
      await confirmOtp(activeConfirmationResult, code);
      toast({ title: "Phone Verified", description: "Your phone number has been successfully verified." });
      router.push("/dashboard"); 
    } catch (error: any) {
      let friendlyMessage = "An unknown error occurred.";
      switch (error.code) {
          case "auth/invalid-verification-code":
              friendlyMessage = "The verification code is invalid. Please try again.";
              break;
          case "auth/code-expired":
              friendlyMessage = "The verification code has expired. Please request a new one.";
              break;
          case "auth/missing-verification-code":
              friendlyMessage = "Please enter the 6-digit OTP.";
              break;
          case "auth/too-many-requests":
              friendlyMessage = "Too many requests. Please try again later.";
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
        <div id="recaptcha-wrapper" ref={recaptchaWrapperRef} className="flex justify-center my-4">
          <div id="recaptcha-container"></div>
        </div>
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
        <Button onClick={handleSubmit} className="w-full" disabled={isLoading}>
          {isLoading && !isResending ? <Loader2 className="animate-spin" /> : "Verify"}
        </Button>
      </CardContent>
      <CardFooter className="flex flex-col items-center text-center text-sm text-muted-foreground">
        <span>Didn&apos;t receive a code?</span>
        <Button
          variant="link"
          className="p-0 h-auto"
          onClick={handleResendOtp}
          disabled={isResending}
        >
          {cooldown > 0 ? (
            `Resend in ${cooldown}s`
          ) : (
             "Resend Code"
          )}
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
