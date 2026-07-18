"use client";

import type { ReactNode } from "react";

interface SliderProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
}

export function Slider({
  id,
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: SliderProps) {
  return (
    <label htmlFor={id} className="mb-3.5 block">
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="text-[11px] uppercase tracking-[0.08em] text-[#8b93a0]">
          {label}
        </span>
        <span className="font-variant-numeric tabular-nums text-[11px] text-[#bfdcf5]">
          {format ? format(value) : value}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="chrome-slider w-full cursor-pointer"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label={label}
      />
    </label>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="my-5 mb-3 flex items-center gap-2.5 first:mt-0">
      <span className="font-display chrome-wordmark-animated bg-clip-text text-[10px] tracking-[0.22em] text-transparent">
        {children}
      </span>
      <span className="h-px flex-1 bg-[rgba(150,157,166,0.22)]" aria-hidden />
    </div>
  );
}

interface ChipProps {
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
  "aria-pressed"?: boolean;
  "aria-label"?: string;
}

export function Chip({
  active = false,
  children,
  onClick,
  disabled,
  type = "button",
  className = "",
  ...aria
}: ChipProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full border px-3.5 py-1.5 font-sans text-[11px] tracking-[0.06em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#bfdcf5] disabled:cursor-not-allowed disabled:opacity-50 ${
        active
          ? "border-[rgba(191,220,245,0.7)] bg-[linear-gradient(115deg,rgba(191,220,245,0.18),rgba(191,220,245,0.05))] text-[#e8f2fc]"
          : "border-[rgba(150,157,166,0.3)] bg-transparent text-[#9aa1ad] hover:border-[rgba(150,157,166,0.5)] hover:text-[#dfe3e9]"
      } ${className}`}
      {...aria}
    >
      {children}
    </button>
  );
}
