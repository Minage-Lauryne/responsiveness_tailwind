import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  render,
  Section,
  Text,
} from "@react-email/components";
import type { CreateEmailOptions } from "resend";
import { Footer } from "../../components/footer";
import styles from "../../components/styles";
import { SEND_FROM_EMAIL } from "../../config";

export async function getEmailLinkVerificationParams(
  email: string,
  userName: string,
  verificationCode: string,
) {
  if (!email) {
    throw new Error("Email is required");
  }
  if (!verificationCode) {
    throw new Error("Verification code is required");
  }

  const emailHtml = await render(
    <EmailLinkVerificationTemplate
      userName={userName}
      verificationCode={verificationCode}
    />,
  );
  const emailText = await render(
    <EmailLinkVerificationTemplate
      userName={userName}
      verificationCode={verificationCode}
    />,
    {
      plainText: true,
    },
  );

  const params: CreateEmailOptions = {
    subject: `${verificationCode} is your verification code to link this email`,
    to: email,
    from: SEND_FROM_EMAIL,
    replyTo: "support@complere.ai",
    html: emailHtml,
    text: emailText,
  };

  return params;
}

interface EmailLinkVerificationTemplateProps {
  userName: string;
  verificationCode: string;
}

export default function EmailLinkVerificationTemplate({
  userName,
  verificationCode,
}: EmailLinkVerificationTemplateProps) {
  return (
    <Html>
      <Head />
      <Preview>
        Your verification code is {verificationCode}
      </Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Section>
            <Heading as="h2" style={styles.heading}>
              Link Email to Your Account
            </Heading>
          </Section>

          <Section>
            <Text>
              Hi {userName ? `${userName}` : "there"},
            </Text>
            <Text>
              You requested to link this email address to your Complēre account.
              Please use the verification code below to complete the linking process:
            </Text>
          </Section>

          <Section>
            <Heading as="h1" style={{ ...styles.heading, fontSize: "36px", margin: "20px 0" }}>
              {verificationCode}
            </Heading>
          </Section>

          <Section>
            <Text>
              This code will expire in 10 minutes.
            </Text>
          </Section>

          <Section>
            <Text>
              To protect your account, do not share this code with anyone.
            </Text>
          </Section>

          <Section>
            <Text>
              If you didn't request to link this email, you can safely ignore this
              email.
            </Text>
          </Section>

          <Footer />
        </Container>
      </Body>
    </Html>
  );
}

EmailLinkVerificationTemplate.PreviewProps = {
  userName: "John Smith",
  verificationCode: "847293",
} as EmailLinkVerificationTemplateProps;
