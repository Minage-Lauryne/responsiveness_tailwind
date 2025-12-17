'use client';

import ErrorPage from "@/components/ErrorPage";

export default function GlobalError() {
  const isLoggedIn = false;

  return <ErrorPage isLoggedIn={isLoggedIn} />;
}
