"use client";

import { useUser } from "@/hooks/use-user";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { initializeFirebase } from "@/firebase";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import {
  startPhoneSignIn,
  getRecaptchaVerifier,
  confirmOtp,
} from "@/firebase/auth";
import { ConfirmationResult } from "firebase/auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const { firestore, storage } = initializeFirebase();

const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return `${hour}:00`;
});

const availableSlotsSchema = z.array(z.object({
    day: z.string(),
    slots: z.array(z.object({
        startTime: z.string(),
        endTime: z.string(),
    }))
}));

const tutorFormSchema = z.object({
  qualification: z.string().min(1, "Qualification is required."),
  CNIC: z
    .string()
    .length(13, "CNIC must be 13 digits.")
    .regex(/^\d{13}$/, "CNIC must contain only digits."),
  locationType: z.enum([
    "tutor_home",
    "student_home",
    "online",
    "center",
  ]),
  availableSlots: availableSlotsSchema
});


export default function BecomeTutorPage() {
  const { user, userData, isLoading: isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPhoneVerify, setShowPhoneVerify] = useState(false);
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] =
    useState<ConfirmationResult | null>(null);
  const [isOtpSubmitting, setIsOtpSubmitting] = useState(false);
  const [degreeFiles, setDegreeFiles] = useState<FileList | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(false);

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];


  const tutorForm = useForm<z.infer<typeof tutorFormSchema>>({
    resolver: zodResolver(tutorFormSchema),
    defaultValues: {
      CNIC: "",
      qualification: "",
      availableSlots: daysOfWeek.map(day => ({ day, slots: [] }))
    },
  });

  const { fields, replace } = useFieldArray({
      control: tutorForm.control,
      name: "availableSlots"
  });

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    }
     if (!isUserLoading && userData && !userData.isProfileCompleted) {
      toast({
        title: "Profile Incomplete",
        description: "Please complete your profile before applying to be a tutor.",
        variant: "destructive"
      });
      router.push("/profile");
    }
  }, [user, userData, isUserLoading, router, toast]);

  useEffect(() => {
      if(userData?.availableSlots && userData.availableSlots.length > 0) {
          replace(userData.availableSlots);
      }
  }, [userData, replace]);
  
  const handleDegreeFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDegreeFiles(e.target.files);
  };

  const uploadFile = async (file: File, path: string): Promise<string> => {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  };

  const handleTutorFormSubmit = async (
    values: z.infer<typeof tutorFormSchema>
  ) => {
    if (!user) return;
    if (!userData?.isPhoneVerified) {
      handlePhoneVerification();
      return;
    }

    setIsSubmitting(true);
    try {
      const degreeUrls = [];
      if (degreeFiles) {
        for (let i = 0; i < degreeFiles.length; i++) {
          const file = degreeFiles[i];
          const url = await uploadFile(
            file,
            `degree-screenshots/${user.uid}/${file.name}`
          );
          degreeUrls.push(url);
        }
      }

      const userRef = doc(firestore, "users", user.uid);
      await setDoc(
        userRef,
        {
          ...values,
          role: "teacher",
          degreeScreenshots: degreeUrls,
          tutorVerificationStatus: "pending",
          currentLocation: currentLocation ? {latitude: currentLocation.latitude, longitude: currentLocation.longitude} : { latitude: "", longitude: "" },
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      toast({ title: "Tutor Application Submitted", description: "Your application is under review. We will get back to you soon." });
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhoneVerification = async () => {
    setShowPhoneVerify(true);
    if (!user || !userData?.phoneNumber) return;
    try {
      const verifier = getRecaptchaVerifier("recaptcha-container-tutor");
      const result = await startPhoneSignIn(userData.phoneNumber, verifier);
      setConfirmationResult(result);
      toast({
        title: "OTP Sent",
        description: `A code has been sent to ${userData.phoneNumber}`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to send OTP",
        description: error.message,
      });
       setShowPhoneVerify(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!confirmationResult || !otp || !user) return;
    setIsOtpSubmitting(true);
    try {
      await confirmOtp(confirmationResult, otp);
      const userRef = doc(firestore, "users", user.uid);
      await setDoc(userRef, { isPhoneVerified: true }, { merge: true });
      toast({ title: "Phone Verified Successfully!" });
      setShowPhoneVerify(false);
      // Automatically submit the form now that phone is verified
      await tutorForm.handleSubmit(handleTutorFormSubmit)();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "OTP Verification Failed",
        description: error.message,
      });
    } finally {
      setIsOtpSubmitting(false);
    }
  };

  const handleGetCurrentLocation = () => {
    setIsLocationLoading(true);
    if(navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ latitude, longitude });
        setIsLocationLoading(false);
        toast({ title: "Location captured successfully!" });
      }, (error) => {
        toast({ variant: "destructive", title: "Error fetching location", description: error.message });
        setIsLocationLoading(false);
      });
    } else {
      toast({ variant: "destructive", title: "Geolocation not supported", description: "Your browser does not support geolocation." });
      setIsLocationLoading(false);
    }
  };

  if (isUserLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="container mx-auto py-12 px-4">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Become a Tutor</CardTitle>
            <CardDescription>
              Fill out the form below to apply as a tutor on LearnSphere.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...tutorForm}>
              <form
                onSubmit={tutorForm.handleSubmit(handleTutorFormSubmit)}
                className="space-y-8"
              >
                <FormField
                  control={tutorForm.control}
                  name="qualification"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Qualification</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your highest qualification" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="bachelors">Bachelor's</SelectItem>
                          <SelectItem value="masters">Master's</SelectItem>
                          <SelectItem value="phd">PhD</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={tutorForm.control}
                  name="CNIC"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNIC (13 digits without dashes)</FormLabel>
                      <FormControl>
                        <Input placeholder="1234512345671" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={tutorForm.control}
                  name="locationType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Tutoring Location</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select location type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="tutor_home">My Home</SelectItem>
                          <SelectItem value="student_home">
                            Student's Home
                          </SelectItem>
                          <SelectItem value="online">Online</SelectItem>
                          <SelectItem value="center">
                            Tutoring Center
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormItem>
                  <FormLabel>Degree Screenshots/Transcripts</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      multiple
                      onChange={handleDegreeFilesChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>

                 <div className="space-y-2">
                    <FormLabel>Current Location</FormLabel>
                    <div className="flex items-center gap-4">
                        <Button type="button" variant="outline" onClick={handleGetCurrentLocation} disabled={isLocationLoading}>
                            {isLocationLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <MapPin className="mr-2 h-4 w-4"/>}
                            Get My Current Location
                        </Button>
                        {currentLocation && (
                            <p className="text-sm text-muted-foreground">
                                Lat: {currentLocation.latitude.toFixed(4)}, Lng: {currentLocation.longitude.toFixed(4)}
                            </p>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                  <FormLabel>Available Time Slots</FormLabel>
                  {fields.map((item, dayIndex) => (
                    <div key={item.id} className="p-4 border rounded-lg">
                      <h3 className="font-semibold">{item.day}</h3>
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        {timeSlots.map((slot, slotIndex) => {
                          const nextSlot = timeSlots[slotIndex + 1] || "00:00";
                          const timeRange = `${slot} - ${nextSlot}`;
                          const isChecked = tutorForm.watch(`availableSlots.${dayIndex}.slots`).some(s => s.startTime === slot);

                          return (
                            <div key={slot} className="flex items-center space-x-2">
                              <Checkbox
                                id={`${item.day}-${slot}`}
                                checked={isChecked}
                                onCheckedChange={(checked) => {
                                  const currentSlots = tutorForm.getValues(`availableSlots.${dayIndex}.slots`);
                                  const newSlots = checked
                                    ? [...currentSlots, { startTime: slot, endTime: nextSlot }]
                                    : currentSlots.filter(s => s.startTime !== slot);
                                  
                                  const allDays = tutorForm.getValues('availableSlots');
                                  allDays[dayIndex].slots = newSlots;
                                  tutorForm.setValue('availableSlots', allDays, { shouldValidate: true });
                                }}
                              />
                              <label htmlFor={`${item.day}-${slot}`} className="text-sm">
                                {timeRange}
                              </label>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                   <FormMessage>{tutorForm.formState.errors.availableSlots?.message}</FormMessage>
                </div>


                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    "Submit Application"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
      <Footer />

      <Dialog open={showPhoneVerify} onOpenChange={setShowPhoneVerify}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Your Phone Number</DialogTitle>
            <DialogDescription>
              To apply as a tutor, we need to verify your phone number. Enter
              the 6-digit code we sent you.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter 6-digit OTP"
            />
            <div id="recaptcha-container-tutor"></div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleVerifyOtp}
              disabled={isOtpSubmitting || !otp}
            >
              {isOtpSubmitting ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Verify & Continue"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
