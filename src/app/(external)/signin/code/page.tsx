import type { Metadata } from "next";

import { AuthCodeForm } from "@/features/auth/components/auth-code-signin";

export const metadata: Metadata = {
  title: "Sign in to Complēre",
  description: "Sign in to Complēre to access your dashboard.",
};

export default function AuthenticationPage() {
  return <AuthCodeForm />;
}
