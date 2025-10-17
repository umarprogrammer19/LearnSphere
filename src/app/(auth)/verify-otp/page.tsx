
"use client";

import React, { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  startPhoneSignIn,
  confirmOtp,
  getRecaptchaVerifier,
} from "@/firebase/auth";
import { ConfirmationResult, RecaptchaVerifier, getAuth } from "firebase/auth";
import { Loader2 } from "lucide-react";

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const auth = getAuth();

  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const phoneNumber = searchParams.get("phone") || "";

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const confirmationResultRef = useRef<ConfirmationResult | null>(null);

  const handleAuthError = useCallback((error: any, title: string) => {
    let friendlyMessage = "An unknown error occurred. Please try again.";
    if (error.code === 'auth/invalid-phone-number') {
      friendlyMessage = "Invalid phone number format. Please ensure it's in the format +923XXXXXXXXX."
    } else if (error.code === 'auth/internal-error' || error.code === 'auth/invalid-app-credential') {
      friendlyMessage = "An internal authentication error occurred. Please check your Firebase project's configuration and ensure the Identity Platform API is enabled in your Google Cloud project."
    } else if (error.message && error.message.includes('reCAPTCHA')) {
      friendlyMessage = "reCAPTCHA validation failed. Please refresh the page and try again."
    } else if (error.code === 'auth/too-many-requests') {
      friendlyMessage = "Too many requests. Please wait a few minutes before trying again."
    } else if (error.code === 'auth/argument-error') {
      friendlyMessage = "There was an issue with reCAPTCHA. Please refresh and try again."
    }
    else {
      friendlyMessage = error.message;
    }
    toast({
      variant: "destructive",
      title: title,
      description: friendlyMessage,
    });
    setIsLoading(false);
    setIsResending(false);
    setCooldown(0);
  }, [toast]);


  const sendOtp = useCallback(async () => {
    if (isResending) return;

    // Do not set isLoading to true here, as the initial load might not be a "resend" action
    setIsResending(true);

    if (!phoneNumber) {
      toast({ variant: "destructive", title: "Error", description: "Phone number not provided." });
      router.push("/signup");
      setIsResending(false);
      return;
    }
    
    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = getRecaptchaVerifier('recaptcha-container', toast);
      }
      const verifier = window.recaptchaVerifier;

      if (!verifier) {
        handleAuthError({ message: "Could not create reCAPTCHA verifier." }, "OTP Send Failed");
        return;
      }
      
      const widgetId = await verifier.render();
      const confirmationResult = await startPhoneSignIn(phoneNumber, verifier);
      confirmationResultRef.current = confirmationResult;

      toast({ title: "OTP Sent", description: `A code has been sent to ${phoneNumber}` });
      setCooldown(60);

    } catch (error: any) {
      handleAuthError(error, "Failed to send OTP");
      if (window.grecaptcha && window.recaptchaVerifier) {
        window.recaptchaVerifier.render().then((widgetId) => {
          // @ts-ignore
          window.grecaptcha.reset(widgetId);
        })
      }
    } finally {
        // Only set loading to false if it was true for the user action
        setIsResending(false);
    }
  }, [phoneNumber, toast, router, handleAuthError, isResending]);


  // Effect to initialize reCAPTCHA and send OTP on initial mount.
  useEffect(() => {
    if (phoneNumber) { // Only send OTP if a phone number is present
        sendOtp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phoneNumber]); // Depend only on phoneNumber to run once when it's available

  // Effect for cooldown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    } else if (isResending) {
      setIsResending(false);
    }
    return () => clearTimeout(timer);
  }, [cooldown, isResending]);


  const handleResendOtp = async () => {
    if (isResending || cooldown > 0) return;
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
    const currentUser = auth.currentUser;


    if (!activeConfirmationResult) {
      toast({
        variant: "destructive",
        title: "Verification Expired",
        description: "Please request a new OTP code.",
      });
      return;
    }
    if (!currentUser) {
      toast({
        variant: "destructive",
        title: "Not Logged In",
        description: "You must be logged in to verify a phone number.",
      });
      router.push("/login");
      return;
    }

    setIsLoading(true);
    try {
      await confirmOtp(activeConfirmationResult, code, currentUser, phoneNumber);
      toast({ title: "Phone Verified!", description: "Your phone number has been successfully verified." });
      router.push("/become-tutor");
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
    <div className="w-full">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold font-headline tracking-tight">
          Check your Phone
        </h1>
        <p className="text-muted-foreground">
          We&apos;ve sent a 6-digit code to {phoneNumber}. Enter it below.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div id="recaptcha-container" className="flex justify-center my-4">
          {/* This div will be populated by the getRecaptchaVerifier function */}
        </div>
        <div
          className="flex justify-center gap-2"
          onPaste={handlePaste}
        >
          {otp.map((digit, index) => (
            <Input
              key={index}
              ref={(el) => { inputRefs.current[index] = el }}
              className="w-12 h-14 text-center text-2xl rounded-xl"
              maxLength={1}
              value={digit}
              onChange={(e) => handleInputChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              disabled={isLoading}
              type="tel"
              inputMode="numeric"
            />
          ))}
        </div>
        <Button type="submit" className="w-full h-12 rounded-xl text-base" disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin" /> : "Verify Phone Number"}
        </Button>
      </form>
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <span>Didn&apos;t receive a code? </span>
        <Button
          variant="link"
          className="p-0 h-auto font-semibold text-primary"
          onClick={handleResendOtp}
          disabled={isResending || cooldown > 0}
          type="button"
        >
          {cooldown > 0 ? (
            `Resend in ${cooldown}s`
          ) : (
            "Resend Code"
          )}
        </Button>
      </div>
    </div>
  );
}


export default function VerifyOtpPage() {
    return (
        <Suspense fallback={<div className="flex w-full items-center justify-center"><Loader2 className="h-10 w-10 animate-spin"/></div>}>
            <VerifyOtpContent />
        </Suspense>
    )
}

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
    grecaptcha?: any;
  }
}
