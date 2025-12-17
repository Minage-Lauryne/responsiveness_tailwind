"use client";

import React from "react";

interface StepIndicatorProps {
  currentStep?: number;
  totalSteps?: number;
}

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  if (currentStep === undefined || totalSteps === undefined) {
    return null;
  }
  return (
    <div className="rounded-full bg-gray-200/70 px-4 py-1.5 text-sm text-gray-600">
      <span>
        {currentStep} of {totalSteps}
      </span>
    </div>
  );
}
