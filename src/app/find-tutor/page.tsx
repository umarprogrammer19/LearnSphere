
"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, query, where } from "firebase/firestore";
import { initializeFirebase } from "@/firebase";
import { Loader2, Search, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useMemo } from 'react';
import { useMemoFirebase } from "@/firebase/provider";

const { firestore } = initializeFirebase();

export default function FindTutorPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const tutorsQuery = useMemoFirebase(() => 
    query(collection(firestore, "users"), where("role", "==", "teacher"))
  , [firestore]);

  const { data: tutors, isLoading, error } = useCollection<any>(tutorsQuery);

  const filteredTutors = useMemo(() => {
    if (!tutors) return [];
    return tutors.filter(tutor => {
      const lowerSearchTerm = searchTerm.toLowerCase();
      const nameMatch = `${tutor.firstName} ${tutor.lastName}`.toLowerCase().includes(lowerSearchTerm);
      const cityMatch = tutor.city?.toLowerCase().includes(lowerSearchTerm);
      const subjectMatch = tutor.teachingSubjects?.some((subject: string) => subject.toLowerCase().includes(lowerSearchTerm));
      return nameMatch || cityMatch || subjectMatch;
    });
  }, [tutors, searchTerm]);
  
  const getInitials = (firstName?: string, lastName?: string) => {
    if (firstName && lastName) return `${firstName.charAt(0)}${lastName.charAt(0)}`;
    if (firstName) return firstName.charAt(0);
    return 'T';
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto py-12 px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold font-headline">Find Your Ideal Tutor</h1>
          <p className="text-lg text-muted-foreground mt-2">Search for verified tutors in your area.</p>
        </div>

        <div className="max-w-4xl mx-auto mb-8">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    placeholder="Search by subject, city, or tutor name..."
                    className="pl-10 h-12 rounded-xl"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex justify-center mt-4">
                <Button className="rounded-xl">
                    <MapPin className="mr-2 h-4 w-4" />
                    Find Nearest Tutor/Institute
                </Button>
            </div>
        </div>

        {isLoading && (
          <div className="flex justify-center">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
          </div>
        )}

        {error && <p className="text-center text-destructive">Error: {error.message}</p>}

        {!isLoading && !error && (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredTutors.map(tutor => (
                <Card key={tutor.id} className="flex flex-col rounded-xl shadow-md hover:shadow-xl transition-shadow">
                    <CardHeader className="flex flex-row items-start gap-4">
                        <Avatar className="w-16 h-16">
                            <AvatarImage src={tutor.profileImageUrl} />
                            <AvatarFallback className="text-2xl">{getInitials(tutor.firstName, tutor.lastName)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <CardTitle className="text-xl">{tutor.firstName} {tutor.lastName}</CardTitle>
                             <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                <MapPin className="h-4 w-4"/>
                                <span>{tutor.city}</span>
                            </div>
                            <div className="flex items-center mt-2">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`h-5 w-5 ${i < 4 ? 'text-accent fill-accent' : 'text-muted-foreground'}`} />
                                ))}
                                <span className="ml-2 text-sm text-muted-foreground">(4.0)</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <div className="mb-4">
                            <h4 className="font-semibold mb-2">Subjects</h4>
                            <div className="flex flex-wrap gap-2">
                                {tutor.teachingSubjects?.slice(0, 3).map((subject: string) => (
                                    <Badge key={subject} variant="secondary">{subject}</Badge>
                                ))}
                                {tutor.teachingSubjects?.length > 3 && (
                                    <Badge variant="outline">+{tutor.teachingSubjects.length - 3} more</Badge>
                                )}
                            </div>
                        </div>
                         <div>
                            <h4 className="font-semibold mb-1">Hourly Rate</h4>
                            <p className="text-lg font-bold text-primary">PKR {tutor.hourlyPricing}/hr</p>
                        </div>
                    </CardContent>
                    <CardFooter>
                         <Button asChild className="w-full rounded-xl">
                            <Link href={`/tutor/${tutor.id}`}>View Tutor Profile</Link>
                        </Button>
                    </CardFooter>
                </Card>
              ))}
           </div>
        )}
         {!isLoading && filteredTutors.length === 0 && (
          <p className="text-center text-muted-foreground mt-8">No tutors found. Try adjusting your search.</p>
        )}
      </main>
      <Footer />
    </div>
  );
}
