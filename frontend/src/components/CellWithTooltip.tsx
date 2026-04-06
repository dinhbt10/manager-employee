import { cn } from "@/lib/utils";

/** Theo spec: tối đa 2 dòng trong bảng, hover hiện đủ nội dung (native tooltip). */
export function CellWithTooltip({
  text,
  className,
}: {
  text: string | null | undefined;
  className?: string;
}) {
  const display = text?.trim() ? text : "—";
  return (
    <span title={display} className={cn("line-clamp-2 min-w-0 break-words", className)}>
      {display}
    </span>
  );
}
