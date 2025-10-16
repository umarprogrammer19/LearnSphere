"use client";
import { useUser } from "@/hooks/use-user";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { StudentDashboard } from "@/components/student-dashboard";
import { TutorDashboard } from "@/components/tutor-dashboard";
import { doc, getDoc } from "firebase/firestore";
import { initializeFirebase } from "@/firebase";

const { firestore } = initializeFirebase();


export default function DashboardPage() {
  const { user, userData, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  // This effect checks if a user is trying to access a role-specific dashboard
  // For which they are not authorized (e.g. student accessing /tutor-dashboard)
  useEffect(() => {
    const verifyRole = async () => {
      if (user && !isLoading) {
        const userDocRef = doc(firestore, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const role = userDoc.data()?.role;
           // Add any role-based redirection logic here if needed in the future
        }
      }
    };
    verifyRole();
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
