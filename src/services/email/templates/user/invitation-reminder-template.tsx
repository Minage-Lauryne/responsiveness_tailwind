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
import { differenceInCalendarDays } from "date-fns";
export async function getInvitationReminderParams(
  email: string,
  organizationName: string,
  token: string,
  expiresAt: Date
) {
  if (!email) throw new Error("Email is required");
  const daysLeft = Math.max(0, differenceInCalendarDays(expiresAt, new Date()));
  const emailHtml = await render(
    <InvitationReminderTemplate
      organizationName={organizationName}
      token={token}
      daysLeft={daysLeft}
    />
  );
  const emailText = await render(
    <InvitationReminderTemplate
      organizationName={organizationName}
      token={token}
      daysLeft={daysLeft}
    />,
    { plainText: true }
  );
  const params: CreateEmailOptions = {
    subject: `Reminder: Invitation to join ${organizationName}`,
    to: email,
    from: SEND_FROM_EMAIL,
    replyTo: SUPPORT_EMAIL,
    html: emailHtml,
    text: emailText,
  };
  return params;
}
interface InvitationReminderTemplateProps {
  organizationName: string;
  token: string;
  daysLeft: number;
}
export default function InvitationReminderTemplate({
  organizationName,
  token,
  daysLeft,
}: InvitationReminderTemplateProps) {
  const base = (FRONTEND_URL || "http://localhost:4040").replace(/\/$/, "");
  const inviteUrl = `${base}/invite/${token}`;
  return (
    <EmailHtml>
      <Head />
      <Preview>Reminder: your invitation to {organizationName} is still pending</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Section>
            <Heading as="h2">Invitation reminder</Heading>
          </Section>
          <Section>
            <Text>Hi there,</Text>
            <Text>
              You were invited to join <strong>{organizationName}</strong>.
            </Text>
            <Text>
              Please accept your invitation within {daysLeft} day{daysLeft !== 1 ? "s" : ""}.
            </Text>
            <Button href={inviteUrl} style={{ backgroundColor: "#2563EB", color: "white", borderRadius: 6 }}>
              Accept Invitation
            </Button>
          </Section>
          <Section>
            <Text>If you no longer want to join, you can ignore this email.</Text>
          </Section>
          <Footer />
        </Container>
      </Body>
    </EmailHtml>
  );
}
InvitationReminderTemplate.PreviewProps = {
  organizationName: "Example Org",
  token: "abc123",
  daysLeft: 4,
};