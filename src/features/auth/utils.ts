"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { api } from "@/trpc/react";

export function useSignOut(redirectPath = "/signin") {
  const router = useRouter();
  const utils = api.useUtils();

  const mutation = useMutation(
    async () => {
      return authClient.signOut({});
    },
    {
      onSuccess: async () => {
        toast.success("Signed out ✔️");
        await utils.me.get.invalidate();
        router.push(redirectPath);
      },
      onError() {
        toast.error("Oops! Something went wrong. Please try again.");
      },
    },
  );
  return mutation;
}
