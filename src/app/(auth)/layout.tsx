import { Logo } from "@/components/logo";
import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <main className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <Link href="/">
                <Logo />
              </Link>
            </div>
          {children}
        </div>
      </main>
      <aside className="hidden lg:flex lg:w-1/2 bg-muted flex-col items-center justify-between p-8">
        <Link href="/" className="self-start">
         <Logo />
        </Link>
        <div className="text-center">
            <Image 
                src="https://picsum.photos/seed/auth/600/400" 
                alt="LearnSphere Education"
                width={600}
                height={400}
                className="rounded-2xl shadow-xl"
                data-ai-hint="abstract geometric learning"
            />
            <h2 className="mt-8 text-3xl font-bold font-headline text-foreground">
                Unlock Your Potential
            </h2>
            <p className="mt-2 text-muted-foreground">
                Join a community of learners and educators.
            </p>
        </div>
        <div className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} LearnSphere. All rights reserved.
        </div>
      </aside>
    </div>
  );
}
