import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type SectionProps = {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function Section({ title, description, actions, children, className }: SectionProps) {
  return (
    <section className={cn("border border-line rounded-[6px] bg-white p-6 sm:p-8 soft-shadow", className)}>
      {(title || description || actions) && (
        <header className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            {title ? <h2 className="text-2xl font-semibold text-gray-900">{title}</h2> : null}
            {description ? <p className="text-sm text-gray-600 leading-relaxed max-w-2xl">{description}</p> : null}
          </div>
          {actions ? <div className="flex-shrink-0">{actions}</div> : null}
        </header>
      )}
      {children}
    </section>
  );
}
