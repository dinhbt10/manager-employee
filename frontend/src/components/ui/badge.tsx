import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-brand-500/30 text-brand-100",
        secondary: "border-white/10 bg-white/5 text-zinc-300",
        success: "border-emerald-500/30 bg-emerald-500/20 text-emerald-200",
        warning: "border-amber-500/30 bg-amber-500/20 text-amber-100",
        destructive: "border-red-500/30 bg-red-500/20 text-red-200",
        outline: "border-white/20 text-zinc-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
