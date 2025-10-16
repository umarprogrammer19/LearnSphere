"use client";

import Link from "next/link";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { useUser } from "@/hooks/use-user";
import { handleSignOut } from "@/firebase/auth";
import { useRouter } from "next/navigation";
import { User as UserIcon, LogOut, LayoutDashboard, UserCircle, Menu, BrainCircuit, Bot, Book } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const navLinks = [
  { href: "#about", label: "About Us" },
  { href: "/find-tutor", label: "Find a Tutor" },
  { href: "/become-tutor", label: "Become a Tutor" },
  { href: "/books", label: "Books" },
  { href: "/ai-chat", label: "AI Chat"},
  { href: "/ai-quiz", label: "AI Quiz"},
];

export function Header() {
  const { user, userData, isLoading } = useUser();
  const router = useRouter();

  const onSignOut = async () => {
    await handleSignOut();
    router.push("/login");
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`;
    }
    if (firstName) {
      return firstName.charAt(0);
    }
    return <UserIcon />;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 px-4 sm:px-8 md:px-16 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-[90px] max-w-screen-2xl items-center">
        <div className="relative top-1 mr-4 flex items-center">
          <Link href="/">
            <Logo />
          </Link>
        </div>
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
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
            <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={userData?.profileImageUrl || ""}
                      alt={userData?.firstName || ""}
                    />
                    <AvatarFallback>
                      {getInitials(userData?.firstName, userData?.lastName)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {userData?.firstName} {userData?.lastName}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <UserCircle className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                 <DropdownMenuItem asChild>
                  <Link href="/books">
                    <Book className="mr-2 h-4 w-4" />
                    <span>Books</span>
                  </Link>
                </DropdownMenuItem>
                 <DropdownMenuItem asChild>
                  <Link href="/ai-chat">
                    <Bot className="mr-2 h-4 w-4" />
                    <span>AI Chat</span>
                  </Link>
                </DropdownMenuItem>
                 <DropdownMenuItem asChild>
                  <Link href="/ai-quiz">
                    <BrainCircuit className="mr-2 h-4 w-4" />
                    <span>AI Quiz</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button asChild className="rounded-xl hidden sm:inline-flex">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild className="rounded-xl hidden sm:inline-flex" variant="outline">
                <Link href="/signup">Sign Up</Link>
              </Button>
            </>
          )}
           <div className="md:hidden">
            <Sheet>
                <SheetTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                >
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle navigation menu</span>
                </Button>
                </SheetTrigger>
                <SheetContent side="left">
                    <nav className="grid gap-6 text-lg font-medium mt-8">
                         <Link href="/" className="flex items-center gap-2 text-lg font-semibold mb-4">
                            <Logo />
                        </Link>
                        {navLinks.map((link) => (
                           <Link key={link.href} href={link.href} className="transition-colors hover:text-foreground/80 text-foreground/60">{link.label}</Link>
                        ))}
                         <div className="flex flex-col gap-4 mt-4">
                            <Button asChild className="rounded-xl w-full">
                                <Link href="/login">Login</Link>
                            </Button>
                            <Button asChild className="rounded-xl w-full" variant="outline">
                                <Link href="/signup">Sign Up</Link>
                            </Button>
                         </div>
                    </nav>
                </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
