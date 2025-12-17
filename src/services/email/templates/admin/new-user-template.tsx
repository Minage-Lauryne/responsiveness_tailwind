import { env } from "@/create-env";
import {
  ADMINS_EMAILS_STRING,
  SEND_FROM_EMAIL,
  SUPPORT_EMAIL,
} from "@/services/email/config";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html as EmailHtml,
  Link,
  Preview,
  Section,
  Text,
  render,
} from "@react-email/components";
import { CreateEmailOptions } from "resend";
import { Footer } from "../../components/footer";
import styles from "../../components/styles";

export interface NewUserTemplateProps {
  email: string;
}

const USERS_URL = `${env.NEXT_PUBLIC_DEPLOYMENT_URL}/app/admin/users`;

export async function getNewUserParams(
  email: string,
): Promise<CreateEmailOptions> {
  const emailHtml = await render(<NewUserTemplate email={email} />);
  const emailText = await render(<NewUserTemplate email={email} />, {
    plainText: true,
  });

  const params: CreateEmailOptions = {
    subject: `New Complēre User Signup: ${email} 📧`,
    to: SUPPORT_EMAIL,
    cc: ADMINS_EMAILS_STRING,
    from: SEND_FROM_EMAIL,
    html: emailHtml,
    text: emailText,
  };

  return params;
}

export default function NewUserTemplate({ email }: NewUserTemplateProps) {
  // Update for getEmailData utils function when #513 is merged
  const domain = email.split("@")[1];
  const userUrl = `${USERS_URL}?email=${encodeURIComponent(email)}`;

  return (
    <EmailHtml>
      <Head />
      <Preview>New Complēre user signup: {email}</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Heading style={styles.heading}>New User Signup Alert</Heading>

          <Section>
            <Text style={styles.bold}>Action Required</Text>
            <Text>
              A new user has signed up to Complēre and needs access approval.
            </Text>
          </Section>

          <Section>
            <Text style={styles.bold}>User Details</Text>
            <Text>
              Email: <Link href={`mailto:${email}`}>{email}</Link>
            </Text>
            <Text>
              Domain: <Link href={`https://${domain}`}>{domain}</Link>
            </Text>
          </Section>

          <Section>
            <Text style={styles.bold}>Next Steps</Text>
            <Text>• Check if user looks real</Text>
            <Text>• Verify domain authenticity</Text>
            <Text>• Give beta access in the admin panel:</Text>
          </Section>

          <Section style={styles.buttonContainer}>
            <Button style={styles.button} href={userUrl}>
              Review User Request
            </Button>
          </Section>

          <Footer />
        </Container>
      </Body>
    </EmailHtml>
  );
}

NewUserTemplate.PreviewProps = {
  email: "kevin@complere.ai",
} as NewUserTemplateProps;
