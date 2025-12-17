import { redirect } from "next/navigation";
import { headers as getHeaders } from "next/headers";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { config } from "@/app/(external)/legal/config";

export type ErrorPageParam = "Configuration" | "AccessDenied" | "Verification";

interface ErrorView {
  status: number;
  heading: string;
  message: JSX.Element;
  signin?: JSX.Element;
}

function SignIn() {
  return (
    <Link href={config.loginUrl}>
      <Button size="lg">Sign in</Button>
    </Link>
  );
}

export default async function ErrorPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const session = await auth.api.getSession({
    headers: await getHeaders(),
  });

  if (session?.user.name) {
    return redirect("/app");
  } else if (session) {
    return redirect("/onboarding");
  }

  const error = searchParams.error as ErrorPageParam | "default";

  const errors: Record<ErrorPageParam | "default", ErrorView> = {
    default: {
      status: 200,
      heading: "Error",
      message: (
        <p>
          <a className="site" href={"/"}>
            Return to the site
          </a>
        </p>
      ),
    },
    Configuration: {
      status: 500,
      heading: "Server error",
      message: (
        <div>
          <p>There is a problem with the server configuration.</p>
          <p>Check the server logs for more information.</p>
        </div>
      ),
    },
    AccessDenied: {
      status: 403,
      heading: "Access Denied",
      message: (
        <div>
          <p>You do not have permission to sign in.</p>
          <p>
            <SignIn />
          </p>
        </div>
      ),
    },
    Verification: {
      status: 403,
      heading: "Unable to sign in",
      message: (
        <div>
          <p>The sign in link is no longer valid.</p>
          <p>It may have been used already or it may have expired.</p>
        </div>
      ),
      signin: <SignIn />,
    },
  };

  const { heading, message, signin } = errors[error] ?? errors.default;

  return (
    <div className="error text-center">
      <div className="card">
        {/* {theme?.logo && <img src={theme?.logo} alt="Logo" className="logo" />} */}
        <h1>{heading}</h1>
        <div className="message">{message}</div>
        To create another sign in email, please enter your email again:{" "}
        <div className="my-8">{signin}</div>
      </div>
    </div>
  );
}
