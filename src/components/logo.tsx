import Image from "next/image";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
};

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Image src="/logo.png" alt="LearnSphere Logo" width={200} height={100} />
    </div>
  );
}
