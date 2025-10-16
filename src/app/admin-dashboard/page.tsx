"use client";

import { useUser } from "@/hooks/use-user";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
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
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, query, where, doc, updateDoc } from "firebase/firestore";
import { initializeFirebase, useMemoFirebase } from "@/firebase";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FullUserProfile } from "@/firebase/auth";

const { firestore } = initializeFirebase();

export default function AdminDashboardPage() {
  const { user, userData, isLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
    if (!isLoading && userData && userData.role !== 'admin') {
      toast({ variant: "destructive", title: "Access Denied", description: "You do not have permission to view this page."});
      router.push("/dashboard");
    }
  }, [user, userData, isLoading, router, toast]);

  const applicationsQuery = useMemoFirebase(() =>
    query(
      collection(firestore, "users"),
      where("role", "==", "teacher"),
      where("tutorVerificationStatus", "==", "pending")
    ),
    []
  );

  const { data: applications, isLoading: isLoadingApplications } = useCollection<FullUserProfile>(applicationsQuery);

  const handleVerifyTutor = async (uid: string) => {
    try {
      const userRef = doc(firestore, "users", uid);
      await updateDoc(userRef, {
        tutorVerificationStatus: "verified",
        updatedAt: new Date(),
      });
      toast({ title: "Teacher Verified", description: "The teacher's profile is now public." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Verification Failed", description: error.message });
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
      <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
        <Card>
          <CardHeader className="px-7">
            <CardTitle>Teacher Applications</CardTitle>
            <CardDescription>
              Review and approve new teacher applications.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Qualification</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingApplications ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : applications && applications.length > 0 ? (
                  applications.map((app) => (
                    <TableRow key={app.uid}>
                      <TableCell>{app.firstName} {app.lastName}</TableCell>
                      <TableCell>{app.email}</TableCell>
                      <TableCell className="capitalize">{app.qualification}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => handleVerifyTutor(app.uid)}
                        >
                          Verify Teacher
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No new applications.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
