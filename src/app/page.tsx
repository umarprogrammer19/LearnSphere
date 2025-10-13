"use client";

import { useUser } from "@/hooks/use-user";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { handleSignOut } from "@/firebase/auth";
import { Loader2 } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  const { user, userData, isLoading } = useUser();
  const router = useRouter();
  const [showProfileCompletionDialog, setShowProfileCompletionDialog] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      // User is not logged in, this is the landing page
    } else if (!isLoading && user && userData) {
      if (userData.isProfileCompleted === false) {
        setShowProfileCompletionDialog(true);
      } else {
        setShowProfileCompletionDialog(false);
      }
    }
  }, [user, userData, isLoading, router]);


  const onSignOut = async () => {
    await handleSignOut();
    router.push("/login");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }
  
  // This is the landing page content for both logged-in and logged-out users.
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative bg-white pt-20 pb-10 lg:pt-[120px] lg:pb-20">
          <div className="container mx-auto">
            <div className="flex flex-wrap items-center -mx-4">
              <div className="w-full px-4 lg:w-1/2">
                <div className="lg:py-12">
                  <h1
                    className="mb-6 text-4xl font-bold font-headline leading-snug text-gray-900 sm:text-5xl sm:leading-snug lg:text-6xl lg:leading-tight"
                  >
                    Find Your Perfect Tutor.
                    <span className="block text-primary">Today.</span>
                  </h1>
                  <p className="mb-8 max-w-[480px] text-base text-gray-600 font-body">
                    LearnSphere is a hyperlocal marketplace connecting students with skilled tutors in their area for personalized, one-on-one learning.
                  </p>
                  <div className="flex items-center space-x-4">
                    <Button asChild size="lg" className="rounded-xl">
                      <Link href="/signup">Get Started</Link>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="rounded-xl">
                      <Link href="#about">Learn More</Link>
                    </Button>
                  </div>
                </div>
              </div>
              <div className="hidden px-4 lg:block lg:w-1/2">
                <div className="relative">
                  <Image
                    src="https://picsum.photos/seed/learn/800/600"
                    alt="Hero Image"
                    width={800}
                    height={600}
                    className="rounded-xl shadow-lg"
                    data-ai-hint="happy student learning"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About Us Section */}
        <section id="about" className="py-20 lg:py-32 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold font-headline text-gray-900 sm:text-4xl">
                About LearnSphere
              </h2>
              <p className="mt-4 text-lg text-gray-600 font-body">
                We believe that quality education should be accessible to everyone. Our mission is to bridge the gap between knowledgeable tutors and eager students, creating a community of learners and educators. LearnSphere provides a secure and easy-to-use platform for finding and booking tutoring sessions that fit your schedule and learning style.
              </p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 lg:py-32">
            <div className="container mx-auto px-4">
              <div className="mx-auto max-w-3xl text-center mb-16">
                  <h2 className="text-3xl font-bold font-headline text-gray-900 sm:text-4xl">Why Choose Us?</h2>
                  <p className="mt-4 text-lg text-gray-600 font-body">Personalized learning experiences tailored just for you.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                  <div className="p-8 border rounded-xl shadow-sm hover:shadow-lg transition-shadow">
                      <h3 className="text-xl font-bold font-headline mb-2">Expert Tutors</h3>
                      <p className="text-gray-600">Access a wide range of verified and experienced tutors for any subject.</p>
                  </div>
                  <div className="p-8 border rounded-xl shadow-sm hover:shadow-lg transition-shadow">
                      <h3 className="text-xl font-bold font-headline mb-2">Flexible Scheduling</h3>
                      <p className="text-gray-600">Find and book sessions that fit your busy schedule, online or in-person.</p>
                  </div>
                  <div className="p-8 border rounded-xl shadow-sm hover:shadow-lg transition-shadow">
                      <h3 className="text-xl font-bold font-headline mb-2">Secure Platform</h3>
                      <p className="text-gray-600">A safe and reliable environment for payments, communication, and learning.</p>
                  </div>
              </div>
            </div>
        </section>
      </main>

      <Dialog open={showProfileCompletionDialog} onOpenChange={setShowProfileCompletionDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete Your Profile</DialogTitle>
          <DialogDescription>
            Please update your profile information to get the most out of LearnSphere.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
           <Button asChild variant="outline" onClick={() => setShowProfileCompletionDialog(false)}>
              <button>Later</button>
           </Button>
          <Button asChild>
            <Link href="/profile">Go to Profile</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

      <Footer />
    </div>
  );
}
