"use client";

import { useUser } from "@/hooks/use-user";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { handleSignOut } from "@/firebase/auth";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/logo";

export default function Home() {
  const { user, userData, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  const onSignOut = async () => {
    await handleSignOut();
    router.push("/login");
  };

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="absolute top-8 left-8">
        <Logo />
      </div>
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold font-headline">Welcome to LearnSphere!</h1>
        {userData && (
          <p className="text-lg text-muted-foreground">
            Signed in as {userData.firstName} {userData.lastName}
          </p>
        )}
        <p className="text-lg text-muted-foreground">({user.email})</p>
        <Button onClick={onSignOut} variant="destructive">
          Sign Out
        </Button>
      </div>
    </div>
  );
}
