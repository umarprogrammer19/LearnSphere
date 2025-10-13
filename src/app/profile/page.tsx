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
import { Textarea } from "@/components/ui/textarea";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format, parse } from "date-fns";
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

const profileFormSchema = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  email: z.string().email(),
  phoneNumber: z.string().min(1, "Phone number is required."),
  dateOfBirth: z.date({ required_error: "Date of birth is required." }),
  country: z.string().min(1, "Country is required."),
  city: z.string().min(1, "City is required."),
  board: z.string().optional(),
  classGrade: z.string().optional(),
  about: z.string().max(500, "About section is too long.").optional(),
  profileImageUrl: z.string().url().optional().or(z.literal("")),
  schoolName: z.string().optional(),
});

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
});

export default function ProfilePage() {
  const { user, userData, isLoading: isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTutorForm, setShowTutorForm] = useState(false);
  const [showPhoneVerify, setShowPhoneVerify] = useState(false);
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] =
    useState<ConfirmationResult | null>(null);
  const [isOtpSubmitting, setIsOtpSubmitting] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [degreeFiles, setDegreeFiles] = useState<FileList | null>(null);

  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      about: "",
      board: "",
      city: "",
      classGrade: "",
      country: "",
      email: "",
      firstName: "",
      lastName: "",
      phoneNumber: "",
      profileImageUrl: "",
      schoolName: "",
    },
  });

  const tutorForm = useForm<z.infer<typeof tutorFormSchema>>({
    resolver: zodResolver(tutorFormSchema),
    defaultValues: {
      CNIC: "",
      qualification: "",
    },
  });

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    }
    if (userData) {
      profileForm.reset({
        ...userData,
        dateOfBirth: userData.dateOfBirth
          ? parse(userData.dateOfBirth, "yyyy-MM-dd", new Date())
          : new Date(),
      });
      if (userData.role === "teacher") {
        setShowTutorForm(true);
        tutorForm.reset({
          CNIC: userData.CNIC,
          qualification: userData.qualification,
          locationType: userData.locationType,
        });
      }
    }
  }, [user, userData, isUserLoading, router, profileForm, tutorForm]);

  const handleProfileImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files[0]) {
      setProfileImageFile(e.target.files[0]);
    }
  };
  const handleDegreeFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDegreeFiles(e.target.files);
  };

  const uploadImage = async (file: File, path: string): Promise<string> => {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  };

  const handleProfileSubmit = async (
    values: z.infer<typeof profileFormSchema>
  ) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      let imageUrl = userData?.profileImageUrl || "";
      if (profileImageFile) {
        imageUrl = await uploadImage(
          profileImageFile,
          `profile-images/${user.uid}`
        );
      }

      const userRef = doc(firestore, "users", user.uid);
      await setDoc(
        userRef,
        {
          ...values,
          dateOfBirth: format(values.dateOfBirth, "yyyy-MM-dd"),
          profileImageUrl: imageUrl,
          isProfileCompleted: true,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      toast({ title: "Profile Updated Successfully" });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTutorApply = async () => {
    if (!userData) return;
    if (userData.isPhoneVerified) {
      setShowTutorForm(true);
    } else {
      setShowPhoneVerify(true);
      try {
        const verifier = getRecaptchaVerifier("recaptcha-container-profile");
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
      }
    }
  };

  const handleVerifyOtp = async () => {
    if (!confirmationResult || !otp) return;
    setIsOtpSubmitting(true);
    try {
      await confirmOtp(confirmationResult, otp);
      toast({ title: "Phone Verified Successfully!" });
      setShowPhoneVerify(false);
      setShowTutorForm(true);
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

  const handleTutorFormSubmit = async (
    values: z.infer<typeof tutorFormSchema>
  ) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const degreeUrls = [];
      if (degreeFiles) {
        for (let i = 0; i < degreeFiles.length; i++) {
          const file = degreeFiles[i];
          const url = await uploadImage(
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
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      toast({ title: "Tutor Application Submitted" });
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
            <CardTitle>My Profile</CardTitle>
            <CardDescription>
              Update your personal and professional information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...profileForm}>
              <form
                onSubmit={profileForm.handleSubmit(handleProfileSubmit)}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={profileForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={profileForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="m@example.com" {...field} disabled />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={profileForm.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+92 300 1234567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={profileForm.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date of Birth</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() ||
                                date < new Date("1900-01-01")
                              }
                              initialFocus
                              captionLayout="dropdown-buttons"
                              fromYear={1950}
                              toYear={new Date().getFullYear()}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Lahore" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                 <FormField
                  control={profileForm.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your country" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pakistan">Pakistan</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={profileForm.control}
                  name="about"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>About</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell us a little bit about yourself"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                    control={profileForm.control}
                    name="profileImageUrl"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Profile Picture</FormLabel>
                        <FormControl>
                            <Input type="file" accept="image/*" onChange={handleProfileImageChange} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    "Update Profile"
                  )}
                </Button>
              </form>
            </Form>

            <hr className="my-8" />

            {!showTutorForm && userData?.role !== 'teacher' && (
              <div className="text-center">
                <Button onClick={handleTutorApply}>
                  Apply to Become a Tutor
                </Button>
              </div>
            )}

            {showTutorForm && (
              <Form {...tutorForm}>
                <form
                  onSubmit={tutorForm.handleSubmit(handleTutorFormSubmit)}
                  className="space-y-8"
                >
                  <h3 className="text-xl font-bold">Tutor Application</h3>
                  <FormField
                    control={tutorForm.control}
                    name="qualification"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Qualification</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. Bachelors in Computer Science"
                            {...field}
                          />
                        </FormControl>
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
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select location type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="tutor_home">My Home</SelectItem>
                            <SelectItem value="student_home">Student's Home</SelectItem>
                            <SelectItem value="online">Online</SelectItem>
                            <SelectItem value="center">Tutoring Center</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormItem>
                        <FormLabel>Degree Screenshots</FormLabel>
                        <FormControl>
                            <Input type="file" multiple onChange={handleDegreeFilesChange} />
                        </FormControl>
                        <FormMessage />
                  </FormItem>


                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      "Submit Application"
                    )}
                  </Button>
                </form>
              </Form>
            )}
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
            <div id="recaptcha-container-profile"></div>
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
