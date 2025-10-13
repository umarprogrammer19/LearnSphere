"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { useUser } from "@/hooks/use-user";
import { handleSignOut } from "@/firebase/auth";
import { useRouter } from "next/navigation";
import { User as UserIcon } from "lucide-react";

const navLinks = [
  { href: "#about", label: "About Us" },
  { href: "/find-tutor", label: "Find a Tutor" },
  { href: "/become-tutor", label: "Become a Tutor" },
  { href: "/contact", label: "Contact Us" },
];

export function Header() {
  const { user, userData, isLoading } = useUser();
  const router = useRouter();

  const onSignOut = async () => {
    await handleSignOut();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <Logo />
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium ml-10">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-4">
          {isLoading ? (
            <div className="h-8 w-20 animate-pulse rounded-md bg-muted" />
          ) : user ? (
            <Avatar>
              <AvatarImage src={userData?.profileImageUrl} alt={userData?.firstName} />
              <AvatarFallback>
                {userData?.firstName ? (
                  `${userData.firstName.charAt(0)}${userData.lastName.charAt(0)}`
                ) : (
                  <UserIcon />
                )}
              </AvatarFallback>
            </Avatar>
          ) : (
            <Button asChild className="rounded-xl">
              <Link href="/login">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}