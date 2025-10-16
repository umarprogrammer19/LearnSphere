
"use client";

import { useUser } from "@/hooks/use-user";
import { Loader2, MoreHorizontal, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, query, where, doc, deleteDoc } from "firebase/firestore";
import { initializeFirebase, useMemoFirebase } from "@/firebase";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FullUserProfile } from "@/firebase/auth";

const { firestore } = initializeFirebase();

export default function AdminStudentsPage() {
  const { user, userData, isLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<FullUserProfile | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
    if (!isLoading && userData && userData.role !== 'admin') {
      toast({ variant: "destructive", title: "Access Denied", description: "You do not have permission to view this page."});
      router.push("/dashboard");
    }
  }, [user, userData, isLoading, router, toast]);

  const studentsQuery = useMemoFirebase(() =>
    query(
      collection(firestore, "users"),
      where("role", "==", "student")
    ),
    []
  );

  const { data: students, isLoading: isLoadingStudents } = useCollection<FullUserProfile>(studentsQuery);

  const openDeleteDialog = (student: FullUserProfile) => {
    setStudentToDelete(student);
    setIsDeleteDialogOpen(true);
  }

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;
    try {
        // Note: Deleting a user from Firestore does not delete their auth record.
        // For a production app, you'd use a Cloud Function to delete the auth user as well.
      await deleteDoc(doc(firestore, "users", studentToDelete.uid));
      toast({ title: "Student Deleted", description: `${studentToDelete.firstName} ${studentToDelete.lastName} has been removed.` });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Deletion Failed", description: error.message });
    } finally {
        setIsDeleteDialogOpen(false);
        setStudentToDelete(null);
    }
  };

  if (isLoading || !userData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }
  
  if (userData.role !== 'admin') {
      return null;
  }

  return (
    <DashboardLayout>
        <Card>
          <CardHeader className="px-7">
            <CardTitle>Manage Students</CardTitle>
            <CardDescription>
              View and manage all student accounts on the platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingStudents ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : students && students.length > 0 ? (
                  students.map((student) => (
                    <TableRow key={student.uid}>
                      <TableCell>{student.firstName} {student.lastName}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell className="capitalize">{student.city}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Toggle menu</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onSelect={() => router.push(`/profile?uid=${student.uid}`)}>Edit</DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600" onSelect={() => openDeleteDialog(student)}>
                                    <Trash className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No students found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the student account
                        and remove their data from our servers.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteStudent} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </DashboardLayout>
  );
}
