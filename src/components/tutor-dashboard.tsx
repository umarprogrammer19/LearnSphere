"use client";

import { useUser } from "@/hooks/use-user";
import { Loader2, MoreVertical, Check, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, query, where, doc, updateDoc } from "firebase/firestore";
import { initializeFirebase, useMemoFirebase } from "@/firebase";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";

const { firestore } = initializeFirebase();

export function TutorDashboard() {
    const { user, userData } = useUser();
    const { toast } = useToast();

    const bookingsQuery = useMemoFirebase(() => 
        user ? query(
            collection(firestore, "bookings"),
            where("tutorId", "==", user.uid),
            where("lessonConfirmed", "==", false)
        ) : null,
    [user]);

    const { data: bookingRequests, isLoading } = useCollection<any>(bookingsQuery);

    const handleBookingAction = async (bookingId: string, confirm: boolean) => {
        const bookingRef = doc(firestore, "bookings", bookingId);
        try {
            await setDocumentNonBlocking(bookingRef, {
                lessonConfirmed: confirm,
                status: confirm ? 'confirmed' : 'rejected'
            }, { merge: true });

            toast({
                title: `Booking ${confirm ? 'Confirmed' : 'Rejected'}`,
                description: `The student will be notified.`,
            });
            // The real-time listener will auto-update the UI
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Action Failed",
                description: error.message,
            });
        }
    };
    
    const getInitials = (firstName?: string, lastName?: string) => {
        if (firstName && lastName) return `${firstName.charAt(0)}${lastName.charAt(0)}`;
        if (firstName) return firstName.charAt(0);
        return 'T';
    };

    return (
        <DashboardLayout>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Card className="rounded-xl shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-2xl font-bold">New Booking Requests</CardTitle>
                             <CardDescription>
                                Review and respond to new lesson requests from students.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                             {isLoading ? (
                                <div className="flex justify-center items-center h-40">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Student</TableHead>
                                            <TableHead>Date & Time</TableHead>
                                            <TableHead>Payment</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {bookingRequests && bookingRequests.length > 0 ? (
                                            bookingRequests.map((req) => (
                                                <TableRow key={req.id}>
                                                    <TableCell className="font-medium">{req.studentName}</TableCell>
                                                    <TableCell>{req.slot.day}, {req.slot.startTime}-{req.slot.endTime}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={req.paymentStatus === 'paid' ? 'default' : 'secondary'} className={req.paymentStatus === 'paid' ? 'bg-green-500' : ''}>
                                                            {req.paymentStatus}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right space-x-2">
                                                        <Button size="icon" variant="outline" className="text-green-600 hover:bg-green-100" onClick={() => handleBookingAction(req.id, true)}>
                                                            <Check className="h-4 w-4" />
                                                        </Button>
                                                        <Button size="icon" variant="outline" className="text-red-600 hover:bg-red-100" onClick={() => handleBookingAction(req.id, false)}>
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                             <TableRow>
                                                <TableCell colSpan={4} className="text-center h-24">No new booking requests.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-1 space-y-8">
                    <Card className="rounded-xl shadow-sm">
                         <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-2xl font-bold">Profile</CardTitle>
                             <Button asChild variant="ghost" size="icon">
                                <Link href="/profile"><MoreVertical className="h-5 w-5" /></Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="text-center">
                            <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-primary">
                                <AvatarImage src={userData?.profileImageUrl} />
                                <AvatarFallback className="text-3xl bg-muted">
                                    {getInitials(userData?.firstName, userData?.lastName)}
                                </AvatarFallback>
                            </Avatar>
                            <h3 className="text-xl font-bold">Welcome back, {userData?.firstName}!</h3>
                            <div className="mt-2 text-sm text-muted-foreground p-2 border rounded-lg">
                                Verification Status: 
                                <Badge variant={userData?.tutorVerificationStatus === 'verified' ? 'default' : 'destructive'} className={userData?.tutorVerificationStatus === 'verified' ? 'bg-green-500 ml-2' : 'ml-2'}>
                                    {userData?.tutorVerificationStatus}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
