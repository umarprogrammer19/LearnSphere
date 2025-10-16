
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
  FormDescription,
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
import { Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { initializeFirebase } from "@/firebase";
import { storage } from "@/firebase/config";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { GoogleMap } from "@/components/google-map";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimePicker } from "@/components/ui/time-picker";
import { FullUserProfile } from "@/firebase/auth";

const { firestore } = initializeFirebase();

const timeSlotSchema = z.object({
  startTime: z.string().min(1, "Start time is required."),
  endTime: z.string().min(1, "End time is required."),
  availableSeats: z.coerce.number().min(1, "Seats must be at least 1."),
});

const availableSlotsSchema = z.array(z.object({
  day: z.string(),
  slots: z.array(timeSlotSchema)
}));

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
  ], { required_error: "Preferred location is required." }),
  availableSlots: availableSlotsSchema,
  teachingSubjects: z.array(z.string()).min(1, "Please select at least one subject."),
  hourlyPricing: z.coerce.number().min(1, "Pricing must be a positive number."),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    formattedAddress: z.string().optional(),
    placeName: z.string().optional(),
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


  const { fields, append, remove } = useFieldArray({
    control: tutorForm.control,
    name: "availableSlots"
  });

  useEffect(() => {
    if (!isUserLoading && !user) {
      toast({ title: "Please log in", description: "You need to be logged in to become a teacher.", variant: "destructive" });
      router.push("/login");
    }
    if (!isUserLoading && userData && !userData.isProfileCompleted) {
      toast({
        title: "Profile Incomplete",
        description: "Please complete your profile before applying to be a teacher.",
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
        description: "Please verify your phone number to become a teacher.",
      });

      let phoneNumber = userData.phoneNumber;
      
      if(!phoneNumber || !/^\+92\d{10}$/.test(phoneNumber)) {
        toast({ variant: "destructive", title: "Invalid Phone Number", description: "Please add a valid phone number in the format +92XXXXXXXXXX to your profile first." })
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
      const newDegreeUrls: string[] = [];
      for (const file of degreeFiles) {
        const url = await uploadFile(
          file,
          `degree-screenshots/${user.uid}/${Date.now()}-${file.name}`
        );
        newDegreeUrls.push(url);
      }

      const allDegreeUrls = [...(userData.degreeScreenshots || []), ...newDegreeUrls];
      const userRef = doc(firestore, "users", user.uid);

      const dataToSave: Partial<FullUserProfile> = {
        ...values,
        role: "teacher",
        degreeScreenshots: allDegreeUrls,
        tutorVerificationStatus: userData.tutorVerificationStatus === 'verified' ? 'verified' : "pending",
        location: values.location ? { latitude: values.location.lat, longitude: values.location.lng, formattedAddress: values.location.formattedAddress, placeName: values.location.placeName } : null,
        updatedAt: serverTimestamp(),
      };


      await setDoc(userRef, dataToSave, { merge: true });

      toast({ title: "✅ Teacher application submitted successfully.", description: "Your application is pending verification." });
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


  const handleMapLocationChange = (location: { lat: number; lng: number, formattedAddress?: string, placeName?: string }) => {
    setCurrentLocation({lat: location.lat, lng: location.lng});
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
            <CardTitle>Become a Teacher</CardTitle>
            <CardDescription>
              Fill out the form below to apply as a teacher on LearnSphere. Your application will be reviewed by our team.
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
                    {userData?.degreeScreenshots?.map((url: string, index: number) => (
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
                  <p className="text-sm text-muted-foreground">Search for your address or drag the pin on the map.</p>
                  <div className="h-[400px] w-full rounded-lg overflow-hidden border">
                    <GoogleMap
                      onLocationChange={handleMapLocationChange}
                      initialCenter={currentLocation}
                      isDraggable={true}
                      showSearchBox={true}
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
                        <FormDescription>
                          Select the days and time slots you are available.
                        </FormDescription>
                        <Tabs defaultValue="Monday" className="w-full">
                          <TabsList className="grid w-full grid-cols-3 md:grid-cols-7">
                            {daysOfWeek.map(day => (
                              <TabsTrigger key={day} value={day}>{day.substring(0,3)}</TabsTrigger>
                            ))}
                          </TabsList>
                          {fields.map((item, dayIndex) => (
                            <TabsContent key={item.id} value={item.day}>
                              <SlotManager dayIndex={dayIndex} control={tutorForm.control} />
                            </TabsContent>
                          ))}
                        </Tabs>
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


function SlotManager({ dayIndex, control }: { dayIndex: number, control: any }) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `availableSlots.${dayIndex}.slots`
  });
  
  const day = control.getValues(`availableSlots.${dayIndex}.day`);

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="font-semibold">{day}</h3>
      {fields.map((slot, slotIndex) => (
        <div key={slot.id} className="flex flex-col md:flex-row gap-4 items-center border-b pb-4">
           <FormField
              control={control}
              name={`availableSlots.${dayIndex}.slots.${slotIndex}.startTime`}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Start Time</FormLabel>
                  <FormControl>
                    <TimePicker value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
           <FormField
              control={control}
              name={`availableSlots.${dayIndex}.slots.${slotIndex}.endTime`}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>End Time</FormLabel>
                   <FormControl>
                    <TimePicker value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={control}
              name={`availableSlots.${dayIndex}.slots.${slotIndex}.availableSeats`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Seats</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" {...field} className="w-24"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
                type="button"
                variant="destructive"
                onClick={() => remove(slotIndex)}
                className="mt-6"
              >
                <X className="h-4 w-4" />
              </Button>
        </div>
      ))}
       <Button
        type="button"
        variant="outline"
        onClick={() => append({ startTime: '09:00', endTime: '10:00', availableSeats: 1 })}
      >
        Add Time Slot
      </Button>
    </div>
  );
}

    