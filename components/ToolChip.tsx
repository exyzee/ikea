import { cn } from "@/lib/utils";

type ToolChipProps = {
  label: string;
  className?: string;
};

export function ToolChip({ label, className }: ToolChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 border border-line bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-800 rounded-[2px]",
        className
      )}
    >
      {label}
    </span>
  );
}
