
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
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only run this effect once on component mount
    if (!recaptchaContainerRef.current) return;
    
    // Ensure the verifier is created only once
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = getRecaptchaVerifier("recaptcha-container");
    }

    const verifier = window.recaptchaVerifier;

    const sendOtp = async () => {
        if (!phoneNumber) {
            toast({ variant: "destructive", title: "Error", description: "Phone number not provided." });
            router.push("/signup");
            return;
        }

        setIsLoading(true);
        try {
            const result = await startPhoneSignIn(phoneNumber, verifier);
            setConfirmationResult(result);
            window.confirmationResult = result;
            toast({ title: "OTP Sent", description: `A code has been sent to ${phoneNumber}` });
        } catch (error: any) {
            handleAuthError(error, "Failed to send OTP");
        } finally {
            setIsLoading(false);
        }
    };
    
    // Render the reCAPTCHA verifier and then send OTP
    verifier.render().then((widgetId: any) => {
        console.log("reCAPTCHA rendered with widgetId:", widgetId);
        sendOtp();
    }).catch((error: any) => {
        console.error("reCAPTCHA render error:", error);
        toast({
            variant: "destructive",
            title: "reCAPTCHA Error",
            description: "Could not render reCAPTCHA. Please refresh the page.",
        });
        setIsLoading(false);
    });

  }, []); // Empty dependency array ensures this runs only once.

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0 && isResending) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    if (cooldown === 0) {
      setIsResending(false);
    }
    return () => clearTimeout(timer);
  }, [cooldown, isResending]);

  const handleResendOtp = async () => {
    setIsResending(true);
    setCooldown(60);
    setIsLoading(true);
    try {
        const verifier = window.recaptchaVerifier;
        if (!verifier) {
            throw new Error("reCAPTCHA verifier not initialized.");
        }
        // It might be necessary to re-render the verifier if it has expired
        await verifier.render();
        const result = await startPhoneSignIn(phoneNumber, verifier);
        setConfirmationResult(result);
        window.confirmationResult = result;
        toast({ title: "OTP Resent", description: `A new code has been sent to ${phoneNumber}` });
    } catch (error: any) {
        handleAuthError(error, "Failed to resend OTP");
        setIsResending(false);
        setCooldown(0);
    } finally {
        setIsLoading(false);
    }
  };

  const handleAuthError = (error: any, title: string) => {
    let friendlyMessage = "An unknown error occurred. Please try again.";
      if(error.code === 'auth/invalid-phone-number'){
          friendlyMessage = "Invalid phone number format. Please enter a valid +92 number."
      } else if (error.code === 'auth/internal-error' || error.code === 'auth/invalid-app-credential') {
          friendlyMessage = "An internal authentication error occurred. Please check your Firebase project's configuration."
      } else if (error.message.includes('reCAPTCHA client element has been removed')) {
          friendlyMessage = "reCAPTCHA validation failed. Please refresh the page and try again."
      } else {
          friendlyMessage = error.message;
      }
    toast({
      variant: "destructive",
      title: title,
      description: friendlyMessage,
    });
  }
  
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
    
    const activeConfirmationResult = window.confirmationResult || confirmationResult;

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
        <div id="recaptcha-container" ref={recaptchaContainerRef} className="flex justify-center my-4"></div>
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
              disabled={isLoading || isResending}
            />
          ))}
        </div>
        <Button onClick={handleSubmit} className="w-full" disabled={isLoading || isResending}>
          {isLoading ? <Loader2 className="animate-spin" /> : "Verify"}
        </Button>
      </CardContent>
      <CardFooter className="flex flex-col items-center text-center text-sm text-muted-foreground">
        <span>Didn&apos;t receive a code?</span>
        <Button
          variant="link"
          className="p-0 h-auto"
          onClick={handleResendOtp}
          disabled={cooldown > 0 || isResending}
        >
          {isResending && cooldown > 0 ? (
            `Resend in ${cooldown}s`
          ) : isResending ? (
             <Loader2 className="animate-spin" />
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
