"use client";

import React from "react";

interface HelpTextBoxProps {
  title?: string;
  children: React.ReactNode;
}

export function HelpTextBox({ title, children }: HelpTextBoxProps) {
  return (
    <div className="rounded-lg bg-blue-50/80 p-6">
      <h3 className="mb-4 text-lg font-medium">{title}</h3>
      <ul className="space-y-3 text-espresso">{children}</ul>
    </div>
  );
}
