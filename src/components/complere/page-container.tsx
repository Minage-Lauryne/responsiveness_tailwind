"use client";

import { useSignOut } from "@/features/auth/utils";
import { api } from "@/trpc/react";
import React from "react";
import { StepIndicator } from "./step-indicator";

interface PageContainerProps {
  title: string;
  description: string;
  currentStep?: number;
  totalSteps?: number;
  children: React.ReactNode;
}

export function PageContainer({
  title,
  description,
  currentStep,
  totalSteps,
  children,
}: PageContainerProps) {
  const { data: userData } = api.me.get.useQuery();

  const signOut = useSignOut();

  return (
    <div className="mx-auto flex max-w-5xl flex-col">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-5xl font-medium text-gray-800">{title}</h1>
          <p className="mt-2 text-xl text-gray-500">
            {description}
            {userData?.email && (
              <span className="ml-1 text-sm">
                Signed in as <span className="font-bold">{userData.email}</span>
                .{" "}
                <button
                  onClick={() => signOut.mutate()}
                  className="text-gray-500 underline hover:text-gray-700"
                >
                  Wrong email? Sign out
                </button>
              </span>
            )}
          </p>
        </div>
        <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />
      </div>
      {children}
    </div>
  );
}
