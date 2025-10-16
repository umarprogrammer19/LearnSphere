"use client";

import { useUser } from "@/hooks/use-user";
import { Loader2, Users, BookUser, ShoppingBag, Package } from "lucide-react";
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
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, query, where, doc, updateDoc } from "firebase/firestore";
import { initializeFirebase, useMemoFirebase } from "@/firebase";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FullUserProfile } from "@/firebase/auth";
import Link from "next/link";

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

  const studentsQuery = useMemoFirebase(() => query(collection(firestore, "users"), where("role", "==", "student")), []);
  const teachersQuery = useMemoFirebase(() => query(collection(firestore, "users"), where("role", "==", "teacher")), []);
  const applicationsQuery = useMemoFirebase(() => query(collection(firestore, "users"), where("tutorVerificationStatus", "==", "pending")), []);
  
  const { data: students, isLoading: isLoadingStudents } = useCollection(studentsQuery);
  const { data: teachers, isLoading: isLoadingTeachers } = useCollection(teachersQuery);
  const { data: applications, isLoading: isLoadingApplications } = useCollection(applicationsQuery);

  if (isLoading || !userData || isLoadingStudents || isLoadingTeachers || isLoadingApplications) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }
  
  if (userData.role !== 'admin') {
      return null;
  }

  const overviewStats = [
    { title: "Total Students", value: students?.length || 0, icon: Users, href: "/admin-dashboard/students" },
    { title: "Total Teachers", value: teachers?.length || 0, icon: BookUser, href: "/admin-dashboard/teachers" },
    { title: "Pending Applications", value: applications?.length || 0, icon: Package, href: "/admin-dashboard/applications" },
    { title: "Shop Owners", value: 0, icon: ShoppingBag, href: "/admin-dashboard/shops" },
  ]

  return (
    <DashboardLayout>
       <CardHeader className="px-0">
          <CardTitle>Admin Overview</CardTitle>
          <CardDescription>
            A high-level view of the LearnSphere platform.
          </CardDescription>
        </CardHeader>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {overviewStats.map((stat) => (
            <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <Link href={stat.href} className="text-xs text-muted-foreground underline">
                        View all
                    </Link>
                </CardContent>
            </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
