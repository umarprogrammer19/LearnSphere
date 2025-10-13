import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  iconOnly?: boolean;
};

export function Logo({ className, iconOnly = false }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <GraduationCap className="h-8 w-8 text-primary" />
      {!iconOnly && (
        <h1 className="text-2xl font-bold font-headline text-primary">
          LearnSphere
        </h1>
      )}
    </div>
  );
}
