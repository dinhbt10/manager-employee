import * as React from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-gradient-to-r from-zinc-100 via-zinc-200/80 to-zinc-100",
        className
      )}
      {...props}
    />
  );
}
