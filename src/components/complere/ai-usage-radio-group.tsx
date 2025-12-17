"use client";

import React from "react";
import * as RadioGroup from "@radix-ui/react-radio-group";
import { BrainCircuit, Computer, Cpu, Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const options = [
  {
    value: "not-using",
    label: "Not using it",
    icon: Cpu,
  },
  {
    value: "occasionally",
    label: "Occasionally",
    icon: Zap,
  },
  {
    value: "few-times-week",
    label: "Few times a week",
    icon: Computer,
  },
  {
    value: "daily",
    label: "Daily",
    icon: Sparkles,
  },
];

interface AIUsageRadioGroupProps {
  value: string;
  onChange: (value: string) => void;
}

export function AIUsageRadioGroup({ value, onChange }: AIUsageRadioGroupProps) {
  return (
    <RadioGroup.Root
      value={value}
      onValueChange={onChange}
      className="grid grid-cols-2 gap-4 md:grid-cols-4"
    >
      {options.map((option) => {
        const Icon = option.icon;
        return (
          <RadioGroup.Item
            key={option.value}
            value={option.value}
            className={cn(
              "group relative rounded-lg px-3 py-4 text-start ring-[1px] ring-border",
              "data-[state=checked]:ring-2 data-[state=checked]:ring-black",
            )}
          >
            <div className="absolute right-0 top-0 h-6 w-6 -translate-y-1/2 translate-x-1/2 rounded-full bg-black text-primary group-data-[state=unchecked]:hidden">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-6 w-6 text-white"
              >
                <path
                  d="M7 13l3 3 7-7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <Icon className="mb-2.5 h-6 w-6 text-muted-foreground" />
            <span className="font-medium tracking-tight">{option.label}</span>
          </RadioGroup.Item>
        );
      })}
    </RadioGroup.Root>
  );
}
