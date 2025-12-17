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
import { CreateEmailOptions } from "resend";
import { env } from "@/create-env";
import { Footer } from "../../components/footer";
import styles from "../../components/styles";
import { SEND_FROM_EMAIL } from "../../config";

export async function getAccountDeletedTemplateParams(
  email: string,
  userName?: string,
) {
  const emailHtml = await render(
    <AccountDeletedTemplate email={email} userName={userName} />,
  );
  const emailText = await render(
    <AccountDeletedTemplate email={email} userName={userName} />,
    {
      plainText: true,
    },
  );

  const params: CreateEmailOptions = {
    subject: `Your Complēre account has been deleted`,
    to: email,
    from: SEND_FROM_EMAIL,
    html: emailHtml,
    text: emailText,
  };

  return params;
}

export default function AccountDeletedTemplate({
  email,
  userName,
}: {
  email: string;
  userName?: string;
}) {
  const restoreUrl = `${env.NEXT_PUBLIC_DEPLOYMENT_URL}/account/restore`;

  return (
    <EmailHtml>
      <Head />
      <Preview>Your Complēre account deletion has been processed - 30-day recovery period available</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Heading>Your Account Deletion Request Has Been Processed</Heading>
          {userName && <Text style={{ fontSize: "16px" }}>Hi {userName},</Text>}
          
          <Text style={{ fontSize: "16px", lineHeight: "24px" }}>
            We have successfully processed your account deletion request in accordance with your data protection rights under GDPR. Here's what has happened:
          </Text>
          
          <Section style={{ 
            marginTop: "20px", 
            marginBottom: "20px",
            padding: "16px",
            backgroundColor: "#f8fafc",
            borderRadius: "8px",
            border: "1px solid #e2e8f0"
          }}>
            <Text style={{ margin: "0 0 12px 0", fontWeight: "bold", fontSize: "15px" }}>
              Data Deleted Immediately:
            </Text>
            <ul style={{ margin: "0", paddingLeft: "20px", fontSize: "14px", lineHeight: "22px" }}>
              <li>All personal chat conversations have been permanently removed</li>
              <li>Your organization memberships have been removed</li>
              <li>Your active sessions have been terminated</li>
            </ul>
          </Section>
          
          <Text style={{ fontSize: "16px", lineHeight: "24px" }}>
            However, we understand that sometimes deletion requests are made in haste. For this reason, we've placed your account in a 30-day grace period.
          </Text>
          
          <Section style={{ 
            marginTop: "24px", 
            marginBottom: "24px",
            padding: "20px",
            backgroundColor: "#eff6ff",
            borderRadius: "8px",
            borderLeft: "4px solid #2563eb",
          }}>
            <Text style={{ margin: "0 0 8px 0", fontWeight: "bold", fontSize: "16px" }}>
              30-Day Recovery Period
            </Text>
            <Text style={{ margin: "0 0 12px 0", fontSize: "15px", lineHeight: "22px" }}>
              If you change your mind, you can request account restoration within the next 30 days. 
              During this period, your personal analyses remain recoverable (though chats cannot be recovered).
            </Text>
            <Text style={{ margin: "0", fontSize: "14px", lineHeight: "20px" }}>
              <strong>What can be restored:</strong> Your personal workspace and analyses<br />
              <strong>What cannot be restored:</strong> Chat conversations (permanently deleted per GDPR right to erasure)
            </Text>
          </Section>

          <Text style={{ fontSize: "16px", lineHeight: "24px" }}>
            To request account restoration, click the button below to log in and submit a restoration request. 
            Our team will review your request promptly.
          </Text>

          <Section style={styles.buttonContainer}>
            <Button style={styles.button} href={restoreUrl}>
              Request Account Restoration
            </Button>
          </Section>

          <Section style={{ 
            marginTop: "24px", 
            marginBottom: "24px",
            padding: "16px",
            backgroundColor: "#fef9c3",
            borderRadius: "8px",
            borderLeft: "4px solid #eab308",
          }}>
            <Text style={{ margin: "0", fontSize: "14px", lineHeight: "20px", color: "#713f12" }}>
              <strong>Important:</strong> After 30 days from the deletion date, your account and all remaining data 
              will be permanently deleted from our systems and cannot be recovered. This permanent deletion ensures 
              full compliance with your data protection rights.
            </Text>
          </Section>

          <Text style={{ fontSize: "16px", lineHeight: "24px", marginTop: "24px" }}>
            <strong>What happens to organization data?</strong><br />
            If you created analyses within organizations, those analyses remain with the organization 
            and will be attributed to "Deleted User" to maintain organizational continuity while respecting 
            your privacy.
          </Text>

          <Text style={{ fontSize: "16px", lineHeight: "24px", marginTop: "24px" }}>
            If you have any questions about your data deletion or need assistance, please don't hesitate 
            to contact us at support@complere.ai. We're here to help.
          </Text>

          <Text style={{ fontSize: "16px", marginTop: "24px" }}>
            Best regards,<br />
            The Complēre Team
          </Text>
          <Footer />
        </Container>
      </Body>
    </EmailHtml>
  );
}

AccountDeletedTemplate.PreviewProps = {
  email: "user@example.com",
  userName: "John Doe",
};