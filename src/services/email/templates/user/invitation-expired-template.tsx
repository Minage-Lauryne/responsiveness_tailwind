import {
  Body,
  Container,
  Head,
  Heading,
  Html as EmailHtml,
  Preview,
  render,
  Section,
  Text,
  Button,
} from "@react-email/components";
import type { CreateEmailOptions } from "resend";
import { Footer } from "../../components/footer";
import styles from "../../components/styles";
import { SEND_FROM_EMAIL, FRONTEND_URL, SUPPORT_EMAIL } from "@/services/email/config";
export async function getInvitationExpiredParams(email: string, organizationName: string) {
  if (!email) throw new Error("Email is required");
  const emailHtml = await render(
    <InvitationExpiredTemplate organizationName={organizationName} email={email} />
  );
  const emailText = await render(
    <InvitationExpiredTemplate organizationName={organizationName} email={email} />,
    { plainText: true }
  );
  const params: CreateEmailOptions = {
    subject: `Your invitation to ${organizationName} has expired`,
    to: email,
    from: SEND_FROM_EMAIL,
    replyTo: SUPPORT_EMAIL,
    html: emailHtml,
    text: emailText,
  };
  return params;
}
interface InvitationExpiredTemplateProps {
  organizationName: string;
  email: string;
}
export default function InvitationExpiredTemplate({ organizationName, email }: InvitationExpiredTemplateProps) {
  const base = (FRONTEND_URL || "http://localhost:4040").replace(/\/$/, "");
  const requestUrl = `${base}/signup?email=${encodeURIComponent(email)}`;
  return (
    <EmailHtml>
      <Head />
      <Preview>Your invitation to {organizationName} has expired</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Section>
            <Heading as="h2">Invitation expired</Heading>
          </Section>
          <Section>
            <Text>Hi there,</Text>
            <Text>
              Your invitation to join <strong>{organizationName}</strong> has expired.
            </Text>
            <Text>If you'd still like to join, you can request access below:</Text>
            <Button href={requestUrl} style={{ backgroundColor: "#2563EB", color: "white", borderRadius: 6 }}>
              Request to Join
            </Button>
          </Section>
          <Section>
            <Text>If you didn't request this, you can ignore this email.</Text>
          </Section>
          <Footer />
        </Container>
      </Body>
    </EmailHtml>
  );
}
InvitationExpiredTemplate.PreviewProps = {
  organizationName: "Example Org",
};