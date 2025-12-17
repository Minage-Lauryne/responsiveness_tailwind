import { Metadata } from "next";

import { AuthEmailSignInForm } from "@/features/auth/components/auth-email-signin";

export const metadata: Metadata = {
  title: "Login to Complēre",
  description: "Login to Complēre to access your dashboard.",
};

export default async function AuthenticationPage() {
  return <AuthEmailSignInForm/>
}
