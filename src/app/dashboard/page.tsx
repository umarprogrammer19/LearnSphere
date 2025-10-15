"use client";
import { useUser } from "@/hooks/use-user";
import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
import { collection, query, where } from "firebase/firestore";
import { initializeFirebase } from "@/firebase";
import { useMemoFirebase } from "@/firebase/provider";
import Link from "next/link";
import { StudentDashboard } from "@/components/student-dashboard";
import { TutorDashboard } from "@/components/tutor-dashboard";

const { firestore } = initializeFirebase();


export default function DashboardPage() {
  const { user, userData, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading || !userData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // Render the appropriate dashboard based on user role
  if (userData.role === 'teacher') {
    return <TutorDashboard />;
  }

  return <StudentDashboard />;
}
