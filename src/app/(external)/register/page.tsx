import { Metadata } from "next";
import { Suspense } from "react";

import { AuthEmailRegisterForm } from "@/features/auth/components/register-flow/auth-email-register";

export const metadata: Metadata = {
  title: "Register to join Complēre Beta",
  description: "Register to join Complēre Beta.",
};

function RegisterFormWithSuspense() {
  return (
    <Suspense fallback={<div className="min-w-xl mx-auto flex flex-col gap-y-4 p-6">Loading...</div>}>
      <AuthEmailRegisterForm />
    </Suspense>
  );
}

export default async function Register() {
  return <RegisterFormWithSuspense />;
}
