"use client";

import type { SelectHTMLAttributes } from "react";
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
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, "value" | "onChange">;

export function Select({ label, options, value, onChangeValue, className, ...rest }: SelectProps) {
  return (
    <label className="flex w-full flex-col gap-2 text-sm text-gray-800">
      {label ? <span className="text-xs font-medium uppercase tracking-wide text-gray-600">{label}</span> : null}
      <select
        value={value}
        onChange={(event) => onChangeValue?.(event.target.value)}
        className={cn(
          "w-full rounded-[2px] border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#0058a3] focus:outline-none",
          className
        )}
        {...rest}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
