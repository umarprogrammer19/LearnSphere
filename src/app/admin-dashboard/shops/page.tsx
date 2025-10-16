
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
import { useToast } from "@/hooks/use-toast";

export default function AdminShopsPage() {
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
            <CardTitle>Manage Shop Owners</CardTitle>
            <CardDescription>
              This feature is coming soon.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-40 flex items-center justify-center text-muted-foreground">
                Stay tuned for updates on shop owner management.
            </div>
          </CardContent>
        </Card>
    </DashboardLayout>
  );
}
