import { PostHog } from "posthog-node";
import { env } from "@/create-env";

let posthogInstance: PostHog | null = null;

export function register() {
  if (process.env.NODE_ENV !== "development") {
    posthogInstance = new PostHog(
      env.NEXT_PUBLIC_POSTHOG_KEY!,
      {
        host: env.NEXT_PUBLIC_POSTHOG_HOST!,
        flushAt: 1,
        flushInterval: 0,
      }
    )
  }
}

export const onRequestError = async (
  err: Error & { digest: string },
  request: { headers: { [key: string]: string } },
  context: unknown,
) => {
  if (process.env.NEXT_RUNTIME === 'nodejs' && posthogInstance) {
    let distinctId = null;
    if (request.headers.cookie) {
      const cookieString = request.headers.cookie;
      const postHogCookieMatch = cookieString.match(/ph_phc_.*?_posthog=([^;]+)/);

      if (postHogCookieMatch && postHogCookieMatch[1]) {
        try {
          const decodedCookie = decodeURIComponent(postHogCookieMatch[1]);
          const postHogData = JSON.parse(decodedCookie);
          distinctId = postHogData.distinct_id;
        } catch (e) {
          console.error('Error parsing PostHog cookie:', e);
        }
      }
    }

    await posthogInstance.captureException(err, distinctId || undefined);
  }
}
