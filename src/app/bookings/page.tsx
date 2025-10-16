
"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { initializeFirebase, useMemoFirebase } from "@/firebase";
import { useCollection } from "@/firebase/firestore/use-collection";
import { useUser } from "@/hooks/use-user";
import { collection, query, where, orderBy } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const { firestore } = initializeFirebase();

export default function BookingsPage() {
  const { user, userData, isLoading: isUserLoading } = useUser();

  const bookingsQuery = useMemoFirebase(() => {
    if (!user || !userData) return null;
    
    if (userData.role === "admin") {
      return query(collection(firestore, "bookings"));
    }
    
    if (userData.role === "student") {
      return query(collection(firestore, "bookings"), where("studentId", "==", user.uid));
    } 
    
    if (userData.role === "teacher") {
      return query(collection(firestore, "bookings"), where("tutorId", "==", user.uid));
    }

    return null;
  }, [user, userData]);

  const { data: bookings, isLoading: isLoadingBookings } = useCollection<any>(bookingsQuery);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "paid":
        return "default";
      case "pending":
      case "cash_pending":
        return "secondary";
      case "rejected":
        return "destructive";
      default:
        return "outline";
    }
  };


  return (
    <DashboardLayout>
      <Card>
        <CardHeader>
          <CardTitle>All Bookings</CardTitle>
          <CardDescription>
            View the history of all bookings on the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isUserLoading || isLoadingBookings ? (
             <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings && bookings.length > 0 ? (
                  bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>{booking.studentName}</TableCell>
                      <TableCell>{booking.tutorName}</TableCell>
                      <TableCell>
                        {booking.slot.day}, {booking.slot.startTime} - {booking.slot.endTime}
                      </TableCell>
                       <TableCell>
                         <Badge variant={getStatusVariant(booking.paymentStatus)} className={booking.paymentStatus === 'paid' ? 'bg-green-500' : ''}>
                            {booking.paymentStatus}
                         </Badge>
                       </TableCell>
                       <TableCell>
                         <Badge variant={booking.lessonConfirmed ? "default" : "secondary"} className={booking.lessonConfirmed ? 'bg-green-500' : ''}>
                            {booking.lessonConfirmed ? "Confirmed" : "Pending"}
                         </Badge>
                       </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No bookings found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
