"use client";

import { useUser } from "@/hooks/use-user";
import { MoreVertical, Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, query, where } from "firebase/firestore";
import { initializeFirebase, useMemoFirebase } from "@/firebase";
import Link from "next/link";

const { firestore } = initializeFirebase();

export function StudentDashboard() {
    const { user, userData } = useUser();

    const upcomingBookingsQuery = useMemoFirebase(() => 
        user ? query(
            collection(firestore, "bookings"),
            where("studentId", "==", user.uid),
            where("lessonConfirmed", "==", true)
        ) : null,
    [user, firestore]);

    const pastBookingsQuery = useMemoFirebase(() => 
        user ? query(
            collection(firestore, "bookings"),
            where("studentId", "==", user.uid),
            // A placeholder for a real date check
            where("lessonConfirmed", "==", false) 
        ) : null,
    [user, firestore]);

    const { data: upcomingBookings } = useCollection<any>(upcomingBookingsQuery);
    const { data: pastBookings } = useCollection<any>(pastBookingsQuery);

    const getInitials = (firstName?: string, lastName?: string) => {
        if (firstName && lastName) return `${firstName.charAt(0)}${lastName.charAt(0)}`;
        if (firstName) return firstName.charAt(0);
        return 'U';
    };

    return (
        <DashboardLayout>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Card className="rounded-xl shadow-sm">
                        <CardHeader>
                            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                                <CardTitle className="text-2xl font-bold">Your Bookings</CardTitle>
                                <div className="flex gap-2">
                                    <Button asChild className="bg-primary hover:bg-primary/90 text-white rounded-lg">
                                        <Link href="/find-tutor">Find a New Teacher</Link>
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                             <Tabs defaultValue="upcoming">
                                <TabsList className="grid w-full grid-cols-2 bg-muted rounded-xl">
                                    <TabsTrigger value="upcoming" className="rounded-lg">Upcoming</TabsTrigger>
                                    <TabsTrigger value="past" className="rounded-lg">Past</TabsTrigger>
                                </TabsList>
                                <TabsContent value="upcoming" className="mt-4">
                                    <BookingsTable bookings={upcomingBookings} />
                                </TabsContent>
                                <TabsContent value="past" className="mt-4">
                                    <BookingsTable bookings={pastBookings} />
                                </TabsContent>
                            </Tabs>
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
                            <p className="text-muted-foreground">{userData?.email}</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}

const BookingsTable = ({ bookings }: { bookings: any[] | null }) => {
    if (!bookings || bookings.length === 0) {
        return <p className="text-center text-muted-foreground py-8">No bookings found.</p>;
    }
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {bookings.map((booking) => (
                    <TableRow key={booking.id}>
                        <TableCell className="font-medium">{booking.tutorName || 'N/A'}</TableCell>
                         <TableCell>
                            {booking.slot.day}, {booking.slot.startTime} - {booking.slot.endTime}
                        </TableCell>
                        <TableCell>{booking.subject || 'General'}</TableCell>
                        <TableCell>
                           <Badge variant={booking.lessonConfirmed ? "default" : "secondary"} className={booking.lessonConfirmed ? "bg-green-500" : ""}>
                            {booking.lessonConfirmed ? 'Confirmed' : 'Pending'}
                           </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                             <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};
