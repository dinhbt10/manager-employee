import { Skeleton } from "@/components/ui/skeleton";

export function TableSkeleton({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-0 p-4">
      <div className="flex gap-3 border-b border-white/10 px-2 pb-3">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`h-${i}`} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-3 border-b border-white/5 px-2 py-3">
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton key={c} className="h-8 flex-1 rounded-md" />
          ))}
        </div>
      ))}
    </div>
  );
}
