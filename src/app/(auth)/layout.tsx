import { Logo } from "@/components/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
       <div className="absolute top-8 left-8">
        <Logo />
      </div>
      <main>{children}</main>
    </div>
  );
}
