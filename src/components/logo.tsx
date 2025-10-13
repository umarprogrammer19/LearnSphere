import Image from "next/image";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  iconOnly?: boolean;
};

export function Logo({ className, iconOnly = false }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Image src="/logo.png" alt="LearnSphere Logo" width={32} height={32} />
      {!iconOnly && (
        <h1 className="text-2xl font-bold font-headline text-primary">
          LearnSphere
        </h1>
      )}
    </div>
  );
}
