
"use client";

import { BookingModal } from "@/components/booking-modal";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { initializeFirebase } from "@/firebase";
import { useDoc } from "@/firebase/firestore/use-doc";
import { useMemoFirebase } from "@/firebase/provider";
import { doc } from "firebase/firestore";
import { BookOpen, CheckCircle, Clock, GraduationCap, Loader2, MapPin, Star } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from 'react';

const { firestore } = initializeFirebase();

export default function TutorDetailPage() {
  const params = useParams();
  const { id } = params;
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const tutorDocRef = useMemoFirebase(() => 
    typeof id === "string" ? doc(firestore, "users", id) : null
  , [id, firestore]);

  const { data: tutor, isLoading, error } = useDoc<any>(tutorDocRef);

  const getInitials = (firstName?: string, lastName?: string) => {
    if (firstName && lastName) return `${firstName.charAt(0)}${lastName.charAt(0)}`;
    if (firstName) return firstName.charAt(0);
    return 'T';
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !tutor) {
    return (
      <>
        <Header />
        <main className="flex-grow container mx-auto py-12 px-4 text-center">
          <h2 className="text-2xl font-bold text-destructive">Teacher not found</h2>
          <p className="text-muted-foreground mt-2">
            {error ? error.message : "The teacher you are looking for does not exist or is not verified."}
          </p>
          <Button asChild className="mt-4">
              <a href="/find-tutor">Back to Search</a>
          </Button>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
    <div className="bg-background">
      <Header />
      <main className="container mx-auto py-12 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Tutor Info */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="rounded-xl shadow-sm">
                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row items-start gap-6">
                        <Avatar className="w-32 h-32 border-4 border-primary">
                            <AvatarImage src={tutor.profileImageUrl} />
                            <AvatarFallback className="text-4xl">{getInitials(tutor.firstName, tutor.lastName)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold font-headline">{tutor.firstName} {tutor.lastName}</h1>
                            <div className="flex items-center gap-2 text-muted-foreground mt-2">
                               <MapPin className="h-5 w-5 text-primary"/> <span>{tutor.city}, {tutor.country}</span>
                            </div>
                             <div className="flex items-center mt-2">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`h-5 w-5 ${i < 4 ? 'text-accent fill-accent' : 'text-gray-300'}`} />
                                ))}
                                <span className="ml-2 text-sm font-medium">4.0 (15 reviews)</span>
                            </div>
                            <div className="mt-4">
                               <p className="text-2xl font-bold text-primary">PKR {tutor.hourlyPricing}/hr</p>
                            </div>
                        </div>
                        <Button size="lg" className="rounded-xl w-full sm:w-auto" onClick={() => setIsBookingModalOpen(true)}>Book Now</Button>
                    </div>
                </CardContent>
            </Card>
            
            <Card className="rounded-xl shadow-sm">
                <CardContent className="p-6">
                    <h2 className="text-2xl font-bold font-headline mb-4">About Me</h2>
                    <p className="text-muted-foreground whitespace-pre-wrap">{tutor.about || "No information provided."}</p>
                </CardContent>
            </Card>

             <Card className="rounded-xl shadow-sm">
                <CardContent className="p-6">
                    <h2 className="text-2xl font-bold font-headline mb-4">Reviews</h2>
                    {/* Placeholder for reviews */}
                    <div className="text-center text-muted-foreground py-8">
                        <p>No reviews yet.</p>
                    </div>
                </CardContent>
            </Card>

          </div>

          {/* Right Column: Details & Availability */}
          <div className="lg:col-span-1 space-y-8">
            <Card className="rounded-xl shadow-sm">
                <CardContent className="p-6 space-y-4">
                     <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2"><GraduationCap className="text-primary"/> Qualification</h3>
                        <p className="text-muted-foreground capitalize">{tutor.qualification}</p>
                    </div>
                     <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2"><BookOpen className="text-primary"/> Subjects</h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {tutor.teachingSubjects?.map((subject: string) => (
                                <Badge key={subject} variant="secondary">{subject}</Badge>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2"><Clock className="text-primary"/> Availability</h3>
                        <p className="text-muted-foreground">See available slots below</p>
                    </div>
                     <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2"><CheckCircle className="text-primary"/> Verification</h3>
                        <p className="text-muted-foreground capitalize">{tutor.tutorVerificationStatus}</p>
                    </div>
                </CardContent>
            </Card>
             <Card className="rounded-xl shadow-sm">
                <CardContent className="p-6">
                     <h2 className="text-2xl font-bold font-headline mb-4">Available Slots</h2>
                      {tutor.availableSlots && tutor.availableSlots.length > 0 ? (
                        <div className="space-y-4">
                          {tutor.availableSlots.filter((day: any) => day.slots.length > 0).map((day: any) => (
                            <div key={day.day}>
                              <h4 className="font-semibold">{day.day}</h4>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {day.slots.map((slot: any, index: number) => (
                                  <Badge key={index} variant="outline">{slot.startTime} - {slot.endTime}</Badge>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground py-8">
                            <p>Teacher has not set their availability yet.</p>
                        </div>
                      )}
                </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
    {tutor && <BookingModal tutor={tutor} isOpen={isBookingModalOpen} setIsOpen={setIsBookingModalOpen} />}
    </>
  );
}
