"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type ToggleProps = {
  label: string;
  description?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
};

export function Toggle({ label, description, checked = false, onChange }: ToggleProps) {
  const [isOn, setIsOn] = useState(checked);

  const handleToggle = () => {
    const next = !isOn;
    setIsOn(next);
    onChange?.(next);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      role="switch"
      aria-checked={isOn}
      className="w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0058a3]"
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-7 w-12 items-center rounded-[2px] border bg-white px-1 transition-colors",
            isOn ? "border-[#0058a3]" : "border-gray-300"
          )}
        >
          <span
            className={cn(
              "block h-5 w-5 rounded-[2px] bg-gray-300 transition-transform",
              isOn ? "translate-x-4 bg-[#0058a3]" : "translate-x-0"
            )}
          />
        </div>
        <div className="space-y-1">
          <div className="text-sm font-semibold text-gray-900">{label}</div>
          {description ? <p className="text-xs text-gray-600 leading-snug max-w-xl">{description}</p> : null}
        </div>
      </div>
    </button>
  );
}
