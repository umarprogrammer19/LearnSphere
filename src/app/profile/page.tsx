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
import { CalendarIcon, Loader2, MapPin } from "lucide-react";
import { format, parse } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { initializeFirebase } from "@/firebase";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


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
  schoolName: z.string().optional(),
  profileImageUrl: z.string().url().optional().or(z.literal("")),
});

export default function ProfilePage() {
  const { user, userData, isLoading: isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(false);

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
      if(userData.currentLocation && userData.currentLocation.latitude) {
        setCurrentLocation(userData.currentLocation);
      }
    }
  }, [user, userData, isUserLoading, router, profileForm]);

  const handleProfileImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files[0]) {
      setProfileImageFile(e.target.files[0]);
       const reader = new FileReader();
      reader.onload = (event) => {
        profileForm.setValue('profileImageUrl', event.target?.result as string)
      };
      reader.readAsDataURL(e.target.files[0]);
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


  const handleProfileSubmit = async (
    values: z.infer<typeof profileFormSchema>
  ) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      let imageUrl = userData?.profileImageUrl || "";
      if (profileImageFile) {
        const storageRef = ref(storage, `profile-images/${user.uid}`);
        await uploadBytes(storageRef, profileImageFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      const userRef = doc(firestore, "users", user.uid);
      await setDoc(
        userRef,
        {
          ...values,
          dateOfBirth: format(values.dateOfBirth, "yyyy-MM-dd"),
          profileImageUrl: imageUrl,
          isProfileCompleted: true,
          currentLocation: currentLocation 
            ? {latitude: currentLocation.latitude, longitude: currentLocation.longitude} 
            : userData?.currentLocation || { latitude: "", longitude: "" },
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


  if (isUserLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  const getInitials = (firstName?: string, lastName?: string) => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`;
    }
    if (firstName) {
      return firstName.charAt(0);
    }
    return 'U';
  };


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
                  <div className="flex justify-center">
                     <FormField
                        control={profileForm.control}
                        name="profileImageUrl"
                        render={({ field }) => (
                            <FormItem>
                            <FormControl>
                                <>
                                <label htmlFor="profile-image-upload" className="cursor-pointer">
                                <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                                    <AvatarImage src={field.value || ""} alt="Profile" />
                                    <AvatarFallback className="text-4xl">
                                        {getInitials(userData?.firstName, userData?.lastName)}
                                    </AvatarFallback>
                                </Avatar>
                                </label>
                                <Input 
                                id="profile-image-upload" 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={handleProfileImageChange} 
                                />
                                </>
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
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
                        value={field.value}
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
                    name="schoolName"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel>School Name</FormLabel>
                            <FormControl><Input placeholder="Your school name" {...field}/></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={profileForm.control}
                        name="board"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Board</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select your board" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="BSEK">BSEK (Karachi)</SelectItem>
                                        <SelectItem value="FBISE">FBISE (Federal)</SelectItem>
                                        <SelectItem value="BISE_LHR">BISE (Lahore)</SelectItem>
                                        <SelectItem value="BISE_RWP">BISE (Rawalpindi)</SelectItem>
                                        <SelectItem value="AKU_EB">AKU-EB</SelectItem>
                                        <SelectItem value="CAMBRIDGE">Cambridge</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={profileForm.control}
                        name="classGrade"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Class/Grade</FormLabel>
                                 <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select your class" />
                                        </Trigger>
                                    </FormControl>
                                    <SelectContent>
                                        {[...Array(12)].map((_, i) => (
                                            <SelectItem key={i+1} value={`${i+1}`}>{`${i+1}`}</SelectItem>
                                        ))}
                                         <SelectItem value="a_level">A-Level</SelectItem>
                                         <SelectItem value="o_level">O-Level</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                
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

            {userData?.role !== 'teacher' && (
              <div className="text-center">
                 <Button asChild>
                    <Link href="/become-tutor">Apply to Become a Tutor</Link>
                 </Button>
              </div>
            )}
            {
                userData?.role === 'teacher' && (
                    <div className="text-center p-4 border-dashed border-2 rounded-lg">
                        <h3 className="text-lg font-semibold">You are a Tutor!</h3>
                        <p className="text-muted-foreground">Your application to become a tutor has been submitted.</p>
                        <p className="text-muted-foreground">Status: <span className="font-bold">{userData.tutorVerificationStatus}</span></p>
                    </div>
                )
            }

          </CardContent>
        </Card>
      </main>
      <Footer />
    </>
  );
}
