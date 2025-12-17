import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html as EmailHtml,
  Preview,
  render,
  Section,
  Text,
} from "@react-email/components";
import type { CreateEmailOptions } from "resend";
import { Footer } from "../../components/footer";
import styles from "../../components/styles";
import { SEND_FROM_EMAIL } from "../../config";

export async function getAuthCodeParams(email: string, emailCode: string) {
  if (!email) {
    throw new Error("Email is required");
  }

  const emailHtml = await render(<AuthCodeTemplate code={emailCode} />);
  const emailText = await render(<AuthCodeTemplate code={emailCode} />, {
    plainText: true,
  });

  const params: CreateEmailOptions = {
    subject: `${emailCode} is your Complēre verification code`,
    to: email,
    from: SEND_FROM_EMAIL,
    replyTo: "support@complere.ai",
    html: emailHtml,
    text: emailText,
  };

  return params;
}

interface AuthCodeTemplateProps {
  code: string;
}

export default function AuthCodeTemplate({ code }: AuthCodeTemplateProps) {
  return (
    <EmailHtml>
      <Head />
      <Preview>Your Complēre verification code is {code}</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Section>
            <Heading as="h2">Verification code</Heading>
          </Section>

          <Section>
            <Text>Enter the following verification code when prompted:</Text>
            <Heading as="h1">{code}</Heading>
          </Section>

          <Section>
            <Text>
              To protect your account, do not share this email or code.
            </Text>
          </Section>

          <Section>
            <Text>
              If you didn't make this request, you can safely ignore this email.
            </Text>
          </Section>

          <Footer />
        </Container>
      </Body>
    </EmailHtml>
  );
}

AuthCodeTemplate.PreviewProps = {
  code: "123456",
  link: "https://example.com/verify?token=abc123",
};
