"use client";
import { useUser } from "@/hooks/use-user";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { StudentDashboard } from "@/components/student-dashboard";
import { TutorDashboard } from "@/components/tutor-dashboard";


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
  if (userData.role === 'admin') {
    router.push('/admin-dashboard');
    return null; 
  }
  
  if (userData.role === 'teacher') {
    return <TutorDashboard />;
  }

  return <StudentDashboard />;
}
