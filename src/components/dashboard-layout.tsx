"use client";

import React from "react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Home,
  LineChart,
  LogOut,
  Menu,
  Search,
  Settings,
  User as UserIcon,
  BookUser,
  Users,
  ShoppingBag,
  Package,
  Bot,
  BrainCircuit,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser } from "@/hooks/use-user";
import { useRouter } from "next/navigation";
import { handleSignOut } from "@/firebase/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";

const studentNavItems = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Find a Teacher", href: "/find-tutor", icon: Search },
  { label: "Bookings", href: "/bookings", icon: LineChart },
];

const teacherNavItems = [
    { label: "Dashboard", href: "/dashboard", icon: Home },
    { label: "Bookings", href: "/bookings", icon: LineChart },
];

const adminNavItems = [
  { label: "Overview", href: "/admin-dashboard", icon: Home },
  { label: "Students", href: "/admin-dashboard/students", icon: Users },
  { label: "Teachers", href: "/admin-dashboard/teachers", icon: BookUser },
  { label: "Shop Owners", href: "/admin-dashboard/shops", icon: ShoppingBag },
  { label: "Bookings", href: "/bookings", icon: LineChart },
  { label: "Applications", href: "/admin-dashboard/applications", icon: Package },
];

const aiNavItems = [
  { label: "AI Chat", href: "/ai-chat", icon: Bot },
  { label: "AI Quiz", href: "/ai-quiz", icon: BrainCircuit },
]

const settingsNavItems = [
  { label: "Account Settings", href: "/settings", icon: Settings },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, userData } = useUser();
  const router = useRouter();

  const onSignOut = async () => {
    await handleSignOut();
    router.push("/login");
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (firstName && lastName) return `${firstName.charAt(0)}${lastName.charAt(0)}`;
    if (firstName) return firstName.charAt(0);
    return <UserIcon />;
  };

  const getNavItems = () => {
      switch(userData?.role) {
          case 'admin': return adminNavItems;
          case 'teacher': return teacherNavItems;
          default: return studentNavItems;
      }
  }

  const navItems = getNavItems();

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <aside className="hidden border-r bg-[--sidebar-background] text-[--sidebar-foreground] md:block">
        <div className="flex h-full max-h-screen flex-col gap-2 mt-10">
          <div className="flex h-14 items-center px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Logo />
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              <span className="px-3 py-2 text-xs font-semibold text-[--sidebar-muted-foreground]">OVERVIEW</span>
              {navItems.map((item) => (
                <NavItem key={item.href} item={item} />
              ))}
              <span className="px-3 py-2 mt-4 text-xs font-semibold text-[--sidebar-muted-foreground]">AI TOOLS</span>
              {aiNavItems.map((item) => (
                <NavItem key={item.href} item={item} />
              ))}
              <span className="px-3 py-2 mt-4 text-xs font-semibold text-[--sidebar-muted-foreground]">SETTINGS</span>
              {settingsNavItems.map((item) => (
                <NavItem key={item.href} item={item} />
              ))}
              <button
                onClick={onSignOut}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-[--sidebar-foreground] transition-all hover:bg-[--sidebar-hover] hover:text-[--sidebar-foreground]"
                )}
              >
                <LogOut className="h-4 w-4" />
                Log Out
              </button>
            </nav>
          </div>
        </div>
      </aside>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col bg-[--sidebar-background] text-[--sidebar-foreground]">
              <nav className="grid gap-2 text-lg font-medium">
                <Link
                  href="/"
                  className="flex items-center gap-2 text-lg font-semibold mb-4"
                >
                  <Logo />
                </Link>
                <span className="px-3 py-2 text-sm font-semibold text-[--sidebar-muted-foreground]">OVERVIEW</span>
                {navItems.map((item) => (
                  <NavItem key={item.href} item={item} isMobile />
                ))}
                 <span className="px-3 py-2 mt-4 text-sm font-semibold text-[--sidebar-muted-foreground]">AI TOOLS</span>
                {aiNavItems.map((item) => (
                  <NavItem key={item.href} item={item} isMobile />
                ))}
                <span className="px-3 py-2 mt-4 text-sm font-semibold text-[--sidebar-muted-foreground]">SETTINGS</span>
                {settingsNavItems.map((item) => (
                  <NavItem key={item.href} item={item} isMobile />
                ))}
                <button
                  onClick={onSignOut}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-[--sidebar-foreground] transition-all hover:bg-[--sidebar-hover] hover:text-[--sidebar-foreground]",
                    "text-lg"
                  )}
                >
                  <LogOut className="h-5 w-5" />
                  Log Out
                </button>
              </nav>
            </SheetContent>
          </Sheet>

          <div className="w-full flex-1 flex items-center justify-end gap-4">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Toggle notifications</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-9 w-9">
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
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}

function NavItem({ item, isMobile = false }: { item: { label: string; href: string; icon: React.ElementType }, isMobile?: boolean }) {
  const pathname = usePathname();
  const isActive = pathname === item.href;
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-[--sidebar-foreground] transition-all hover:bg-[--sidebar-hover]",
        isActive && "bg-[--sidebar-active] text-[--sidebar-active-foreground] hover:bg-[--sidebar-active]/90",
        isMobile && "text-lg"
      )}
    >
      <Icon className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
      {item.label}
    </Link>
  );
}
