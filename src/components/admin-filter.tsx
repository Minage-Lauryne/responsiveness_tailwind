"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface BooleanFilterProps {
  value: boolean | undefined;
  onChange: (value: boolean | undefined) => void;
  className?: string;
  title: string;
  trueLabel: string;
  falseLabel: string;
}

interface AdminFilterProps {
  value: boolean | undefined;
  onChange: (value: boolean | undefined) => void;
  className?: string;
}

interface BetaFilterProps {
  value: boolean | undefined;
  onChange: (value: boolean | undefined) => void;
  className?: string;
}

interface FilterOptionProps {
  label: string;
  checked: boolean;
  onChange: () => void;
  className?: string;
}

function FilterOption({
  label,
  checked,
  onChange,
  className,
}: FilterOptionProps) {
  return (
    <div
      className={cn(
        "flex cursor-pointer items-center space-x-2 text-sm",
        className,
      )}
      onClick={onChange}
    >
      <div
        className={cn(
          "h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          checked ? "bg-primary text-primary-foreground" : "bg-background",
        )}
      >
        {checked && <Check className="h-4 w-4" />}
      </div>
      <span>{label}</span>
    </div>
  );
}

function BooleanFilter({
  value,
  onChange,
  className,
  title,
  trueLabel,
  falseLabel,
}: BooleanFilterProps) {
  return (
    <div className={cn("flex flex-col space-y-2", className)}>
      <div className="text-sm font-medium">{title}</div>
      <div className="space-y-2">
        <FilterOption
          label={trueLabel}
          checked={value === true}
          onChange={() => onChange(value === true ? undefined : true)}
        />
        <FilterOption
          label={falseLabel}
          checked={value === false}
          onChange={() => onChange(value === false ? undefined : false)}
        />
      </div>
    </div>
  );
}

export function AdminFilter({ value, onChange, className }: AdminFilterProps) {
  return (
    <BooleanFilter
      value={value}
      onChange={onChange}
      className={className}
      title="User Type"
      trueLabel="Admin"
      falseLabel="Not Admin"
    />
  );
}

export function BetaFilter({ value, onChange, className }: BetaFilterProps) {
  return (
    <BooleanFilter
      value={value}
      onChange={onChange}
      className={className}
      title="Beta Program"
      trueLabel="In Beta"
      falseLabel="Not in Beta"
    />
  );
}
