import { redirect } from "next/navigation";
import { headers as getHeaders } from "next/headers";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { config } from "@/app/(external)/legal/config";

export type RegisterErrorPageParam = "Configuration" | "TemporaryEmail" | "AlreadyRegistered" | "InvalidEmail";

interface ErrorView {
  status: number;
  heading: string;
  message: JSX.Element;
  register?: JSX.Element;
}

function Register() {
  return (
    <Link href={config.registerUrl}>
      <Button size="lg">Register</Button>
    </Link>
  );
}

export default async function RegisterErrorPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const session = await auth.api.getSession({
    headers: await getHeaders(),
  });

  if (session?.user.name) {
    return redirect("/app");
  }

  if (session) {
    return redirect("/onboarding");
  }


  const email = searchParams.email as string | undefined;
  const registerUrl = email ? `${config.registerUrl}?email=${encodeURIComponent(email)}` : config.registerUrl;

  const error = searchParams.error as RegisterErrorPageParam | "default";

  const errors: Record<RegisterErrorPageParam | "default", ErrorView> = {
    default: {
      status: 200,
      heading: "Registration Failed",
      message: (
        <p>
          Something went wrong during registration.
          <br />
          <a className="site" href={registerUrl}>
            Try registering again
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
    TemporaryEmail: {
      status: 400,
      heading: "Temporary Email Not Allowed",
      message: (
        <div>
          <p>We do not accept temporary or disposable email addresses for registration.</p>
          <p>Please use a work or personal email address.</p>
        </div>
      ),
    },
    AlreadyRegistered: {
      status: 409,
      heading: "Account Already Exists",
      message: (
        <div>
          <p>An account with this email already exists.</p>
          <p>
            <Link href={config.loginUrl} className="underline">
              Sign in instead
            </Link>
          </p>
        </div>
      ),
    },
    InvalidEmail: {
      status: 400,
      heading: "Invalid Email",
      message: (
        <div>
          <p>The email address you entered is not valid.</p>
          <p>Please check the format and try again.</p>
        </div>
      ),
    },
  };

  const { heading, message, register } = errors[error] ?? errors.default;

  return (
    <div className="error text-center">
      <div className="card">
        {/* {theme?.logo && <img src={theme?.logo} alt="Logo" className="logo" />} */}
        <h1>{heading}</h1>
        <div className="message">{message}</div>
        {register && <div className="my-8">{register}</div>}
        <p className="mt-4">
          To try again, please go back to{" "}
          <div className="my-8"><Register/></div>

        </p>
      </div>
    </div>
  );
}