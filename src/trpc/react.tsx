/* eslint-disable @typescript-eslint/no-misused-promises */
"use client";

import { authClient } from "@/lib/auth-client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TRPCClientError, unstable_httpBatchStreamLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { redirect } from "next/navigation";
import { useState } from "react";

import { ensureError } from "@/lib/utils";
import { type AppRouter } from "@/server/api/root";
import { toast } from "sonner";
import { getUrl, transformer } from "./shared";

export const api = createTRPCReact<AppRouter>();

export function TRPCReactProvider(props: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            onError: async (err) => {
              if (err instanceof TRPCClientError) {
                const typedErr = err as {
                  shape?: {
                    data?: Record<string, string>;
                  };
                };
                if (typedErr.shape?.data?.code === "UNAUTHORIZED") {
                  try {
                    await authClient.signOut({});
                  } catch {}
                  toast.error(
                    `Complēre encountered a problem with your authentication. Please try logging in again.`,
                  );
                  redirect("/signin");
                  return;
                }
              }

              const error = ensureError(err);
              toast.error(
                `We're sorry! Complēre has encountered an error: ${error.message}`,
              );
            },
          },
          mutations: {
            onError: (err) => {
              const error = ensureError(err);
              toast.error(
                `We're sorry! Complēre has encountered an error: ${error.message}`,
              );
            },
          },
        },
      }),
  );

  const [trpcClient] = useState(() =>
    api.createClient({
      transformer,
      links: [
        // loggerLink({
        //   enabled: (op) =>
        //     process.env.NODE_ENV === "development" ||
        //     (op.direction === "down" && op.result instanceof Error),
        // }),
        unstable_httpBatchStreamLink({
          url: getUrl(),
        }),
      ],
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <api.Provider client={trpcClient} queryClient={queryClient}>
        {props.children}
      </api.Provider>
    </QueryClientProvider>
  );
}
