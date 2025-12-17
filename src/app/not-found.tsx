import ErrorPage from "@/components/ErrorPage";
import { getSessionToken } from "@/lib/session";

export default async function NotFound() {
  const token = await getSessionToken();
  const isLoggedIn = !!token;

  return <ErrorPage isLoggedIn={isLoggedIn} />;
}
