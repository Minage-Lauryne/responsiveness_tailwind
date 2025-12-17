import { Toaster } from "@/components/ui/sonner";
import "@/styles/globals.css";

import { Montserrat } from "next/font/google";
import { TRPCReactProvider } from "@/trpc/react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { getSessionToken } from "@/lib/session";
import { PostHogProvider } from "@/providers/PostHogProvider";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata = {
  title: "Complēre",
  description:
    "Complēre is your research, evaluation and reporting sidekick, delivering grounded insights, and designed to be questioned, challenged, and improved by experts like you.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await getSessionToken();
  const isLoggedIn = !!token;

  return (
    <html lang="en">
      <body className={`font-sans ${montserrat.variable}`}>
        <PostHogProvider>
          <ErrorBoundary isLoggedIn={isLoggedIn}>
            <TRPCReactProvider>{children}</TRPCReactProvider>
            <Toaster />
          </ErrorBoundary>
        </PostHogProvider>
      </body>
    </html>
  );
}
