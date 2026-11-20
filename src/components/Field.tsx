import React from "react";

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string;
  right?: React.ReactNode;
}

export function Field({
  label,
  id,
  error,
  right,
  className = "",
  ...props
}: FieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <label htmlFor={id} className="text-[13px] font-medium text-[#4A4943]">
          {label}
        </label>
        {right}
      </div>
      <input
        id={id}
        className={`h-14 box-border rounded-2xl border border-line bg-white px-[18px] text-base text-ink placeholder:text-[#9E9C94] focus:outline-none focus:border-brand transition-colors ${
          error ? "border-red-400" : ""
        } ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-600 mt-0.5">{error}</span>}
    </div>
  );
}
