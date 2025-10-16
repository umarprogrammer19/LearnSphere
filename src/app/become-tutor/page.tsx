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
import { Loader2, MapPin, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { initializeFirebase } from "@/firebase";
import { storage } from "@/firebase/config";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { GoogleMap } from "@/components/google-map";

const { firestore } = initializeFirebase();

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
})).min(1, "Please select at least one available time slot.").refine(
    (days) => days.some(day => day.slots.length > 0),
    { message: "Please select at least one available time slot." }
);

const subjects = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "English",
  "Urdu",
  "Pakistan Studies",
  "Islamic Studies",
  "Art",
  "Music"
];

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
  ], { required_error: "Preferred location is required."}),
  availableSlots: availableSlotsSchema,
  teachingSubjects: z.array(z.string()).min(1, "Please select at least one subject."),
  hourlyPricing: z.coerce.number().min(1, "Pricing must be a positive number."),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
});


export default function BecomeTutorPage() {
  const { user, userData, isLoading: isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [degreeFiles, setDegreeFiles] = useState<File[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | undefined>(undefined);


  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];


  const tutorForm = useForm<z.infer<typeof tutorFormSchema>>({
    resolver: zodResolver(tutorFormSchema),
    defaultValues: {
      CNIC: "",
      qualification: "",
      availableSlots: daysOfWeek.map(day => ({ day, slots: [] })),
      teachingSubjects: [],
      hourlyPricing: 0,
    },
  });
  
  useEffect(() => {
    if (userData) {
      tutorForm.reset({
        CNIC: userData.CNIC || "",
        qualification: userData.qualification || "",
        teachingSubjects: userData.teachingSubjects || [],
        hourlyPricing: userData.hourlyPricing || 0,
        availableSlots: userData.availableSlots && userData.availableSlots.length > 0 ? userData.availableSlots : daysOfWeek.map(day => ({ day, slots: [] })),
        locationType: userData.locationType,
        location: userData.location ? { lat: userData.location.latitude, lng: userData.location.longitude } : undefined,
      });

      if (userData.location?.latitude) {
        const loc = { lat: userData.location.latitude, lng: userData.location.longitude };
        setCurrentLocation(loc);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData]);


  const { fields } = useFieldArray({
      control: tutorForm.control,
      name: "availableSlots"
  });

  useEffect(() => {
    if (!isUserLoading && !user) {
      toast({ title: "Please log in", description: "You need to be logged in to become a tutor.", variant: "destructive" });
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
  
  const handleDegreeFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setDegreeFiles(prev => [...prev, ...Array.from(e.target.files as FileList)]);
    }
  };

  const removeDegreeFile = (index: number) => {
    setDegreeFiles(prev => prev.filter((_, i) => i !== index));
  };


  const uploadFile = async (file: File, path: string): Promise<string> => {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  };

  const handleTutorFormSubmit = async (
    values: z.infer<typeof tutorFormSchema>
  ) => {
    if (!user || !userData) return;

    if (!userData.isPhoneVerified) {
      toast({
        title: "Phone Verification Required",
        description: "Please verify your phone number to become a tutor.",
      });

      let phoneNumber = userData.phoneNumber;
      if (phoneNumber && !phoneNumber.startsWith('+92')) {
        phoneNumber = `+92${phoneNumber.replace(/^0/, '')}`;
      } else if (!phoneNumber) {
          toast({variant: "destructive", title: "Missing Phone Number", description: "Please add a phone number to your profile first."})
          router.push('/profile');
          return;
      }
      
      router.push(`/verify-otp?phone=${encodeURIComponent(phoneNumber)}`);
      return;
    }

    if (degreeFiles.length === 0 && (!userData.degreeScreenshots || userData.degreeScreenshots.length === 0)) {
        toast({ variant: "destructive", title: "Missing Documents", description: "Please upload your degree screenshots." });
        return;
    }


    setIsSubmitting(true);
    try {
      // Logic for uploading only new files.
      const newDegreeUrls = [];
      for (const file of degreeFiles) {
        // A simple check to see if the file is new. In a real app, you might check against existing URLs.
        const url = await uploadFile(
          file,
          `degree-screenshots/${user.uid}/${Date.now()}-${file.name}`
        );
        newDegreeUrls.push(url);
      }

      // Combine old URLs with new ones.
      const allDegreeUrls = [...(userData.degreeScreenshots || []), ...newDegreeUrls];

      const userRef = doc(firestore, "users", user.uid);

      // This logic ensures we're only updating an existing document.
      // `setDoc` with `{ merge: true }` will create the doc if it doesn't exist,
      // but the app flow ensures it always exists. Using it is a safe way to update.
      const dataToSave = {
        ...values,
        role: "tutor",
        degreeScreenshots: allDegreeUrls,
        tutorVerificationStatus: userData.tutorVerificationStatus === 'verified' ? 'verified' : "pending",
        location: values.location ? { latitude: values.location.lat, longitude: values.location.lng } : null,
        updatedAt: serverTimestamp(),
      };


      await setDoc(userRef, dataToSave, { merge: true });

      toast({ title: "✅ Tutor application submitted successfully.", description: "Your application is pending verification." });
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


  const handleMapLocationChange = (location: { lat: number; lng: number }) => {
    setCurrentLocation(location);
    tutorForm.setValue("location", location, { shouldValidate: true });
  };
  
  if (isUserLoading || !userData) {
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
              Fill out the form below to apply as a tutor on LearnSphere. Your application will be reviewed by our team.
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
                  name="teachingSubjects"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teaching Subjects</FormLabel>
                        <Select onValueChange={(value) => !field.value.includes(value) && field.onChange([...field.value, value])} >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select subjects you teach" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {subjects.map(subject => (
                               <SelectItem key={subject} value={subject} disabled={field.value.includes(subject)}>
                                {subject}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {field.value.map((subject) => (
                                <div key={subject} className="flex items-center gap-2 bg-muted p-2 rounded-md">
                                    <span>{subject}</span>
                                    <button type="button" onClick={() => field.onChange(field.value.filter(s => s !== subject))} className="text-red-500 hover:text-red-700">
                                        &times;
                                    </button>
                                </div>
                            ))}
                        </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={tutorForm.control}
                  name="hourlyPricing"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hourly Rate (PKR)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 1000" {...field} />
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
                      accept="image/*,.pdf"
                      onChange={handleDegreeFilesChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>You can upload multiple files.</FormDescription>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {userData?.degreeScreenshots?.map((url, index) => (
                      <div key={index} className="relative">
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 underline">Existing File {index + 1}</a>
                      </div>
                    ))}
                    {degreeFiles.map((file, index) => (
                      <div key={index} className="relative group bg-muted p-2 rounded-md text-sm">
                        <span>{file.name}</span>
                        <Button type="button" variant="ghost" size="icon" className="absolute top-0 right-0 h-full w-8 text-red-500 opacity-0 group-hover:opacity-100" onClick={() => removeDegreeFile(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>

                <div className="space-y-4">
                    <FormLabel>Your Location (for in-person tutoring)</FormLabel>
                    <p className="text-sm text-muted-foreground">Click the button to capture your location, or search and drag the pin on the map.</p>
                     <div className="h-[400px] w-full rounded-lg overflow-hidden border">
                         <GoogleMap 
                            onLocationChange={handleMapLocationChange}
                            initialCenter={currentLocation}
                            isDraggable={true}
                         />
                     </div>
                      {tutorForm.formState.errors.location && <FormMessage>{tutorForm.formState.errors.location.message}</FormMessage>}
                </div>

                <div className="space-y-4">
                  <FormField
                      control={tutorForm.control}
                      name="availableSlots"
                      render={() => (
                          <FormItem>
                              <FormLabel>Available Time Slots</FormLabel>
                               <FormDescription>Select the hours you are available on each day.</FormDescription>
                              {fields.map((item, dayIndex) => (
                                <div key={item.id} className="p-4 border rounded-lg">
                                  <h3 className="font-semibold">{item.day}</h3>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-2">
                                    {timeSlots.map((slot) => {
                                      const timeRange = `${slot} - ${timeSlots[timeSlots.indexOf(slot) + 1] || "00:00"}`;
                                      const isChecked = tutorForm.watch(`availableSlots.${dayIndex}.slots`).some(s => s.startTime === slot);

                                      return (
                                          <div key={slot} className="flex items-center space-x-2">
                                              <Checkbox
                                                  id={`${item.day}-${slot}`}
                                                  checked={isChecked}
                                                  onCheckedChange={(checked) => {
                                                      const currentSlots = tutorForm.getValues(`availableSlots.${dayIndex}.slots`);
                                                      let newSlots;
                                                      const nextSlot = timeSlots[timeSlots.indexOf(slot) + 1] || "00:00";
                                                      
                                                      if (checked) {
                                                          newSlots = [...currentSlots, { startTime: slot, endTime: nextSlot }];
                                                      } else {
                                                          newSlots = currentSlots.filter(s => s.startTime !== slot);
                                                      }

                                                      const allDays = tutorForm.getValues('availableSlots');
                                                      allDays[dayIndex].slots = newSlots.sort((a, b) => a.startTime.localeCompare(b.startTime));
                                                      tutorForm.setValue('availableSlots', allDays, { shouldValidate: true, shouldDirty: true });
                                                  }}
                                              />
                                              <label htmlFor={`${item.day}-${slot}`} className="text-sm font-normal cursor-pointer select-none">
                                                  {timeRange}
                                              </label>
                                          </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              ))}
                              <FormMessage>{tutorForm.formState.errors.availableSlots?.message || tutorForm.formState.errors.availableSlots?.root?.message}</FormMessage>
                          </FormItem>
                      )}
                  />
                </div>


                <Button type="submit" disabled={isSubmitting} className="w-full">
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
    </>
  );
}
