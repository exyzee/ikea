import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type WarningCalloutProps = {
  title?: string;
  children: ReactNode;
  className?: string;
};

export function WarningCallout({ title, children, className }: WarningCalloutProps) {
  return (
    <div
      className={cn(
        "rounded-[4px] border border-[#d4b200] bg-[#ffdb00] px-4 py-3 text-sm text-gray-900",
        className
      )}
    >
      {title ? <div className="mb-2 text-sm font-semibold uppercase tracking-wide">{title}</div> : null}
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}
