"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Option = {
  label: string;
  value: string;
};

type SelectProps = {
  label?: string;
  options: Option[];
  value?: string;
  onChangeValue?: (value: string) => void;
  className?: string;
  placeholder?: string;
};

export function Select({ label, options, value, onChangeValue, className, placeholder }: SelectProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const current = options.find((option) => option.value === value);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!wrapperRef.current || wrapperRef.current.contains(event.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={wrapperRef} className={cn("relative z-40 w-full overflow-visible", className)}>
      <label className="flex w-full flex-col gap-2 text-sm text-gray-800">
        {label ? <span className="text-xs font-medium uppercase tracking-wide text-gray-600">{label}</span> : null}
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex w-full items-center justify-between rounded-[2px] border border-black bg-white px-3 py-2 text-sm font-semibold uppercase tracking-[0.12em] text-gray-900 transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0058a3]"
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span>{current?.label ?? placeholder ?? "Select"}</span>
          <span className="text-gray-700">
            <svg width="12" height="8" viewBox="0 0 12 8" aria-hidden>
              <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" fill="none" />
            </svg>
          </span>
        </button>
      </label>
      {open ? (
        <ul
          role="listbox"
          className="absolute z-50 mt-2 max-h-56 w-full overflow-auto rounded-[2px] border border-black bg-white py-1 text-xs font-semibold uppercase tracking-[0.12em] shadow-[0_10px_24px_rgba(15,15,15,0.12)]"
        >
          {options.map((option) => {
            const active = option.value === value;
            return (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChangeValue?.(option.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between px-3 py-2 text-left transition-colors",
                    active ? "bg-black text-white" : "hover:bg-gray-50"
                  )}
                >
                  <span>{option.label}</span>
                  {active ? <span className="text-[10px] tracking-[0.2em]">Selected</span> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
