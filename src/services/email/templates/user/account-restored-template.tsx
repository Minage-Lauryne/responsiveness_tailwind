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

export async function getAccountRestoredTemplateParams(
  email: string,
  userName?: string,
) {
  const emailHtml = await render(
    <AccountRestoredTemplate email={email} userName={userName} />,
  );
  const emailText = await render(
    <AccountRestoredTemplate email={email} userName={userName} />,
    {
      plainText: true,
    },
  );

  const params: CreateEmailOptions = {
    subject: `Your Complēre account has been restored`,
    to: email,
    from: SEND_FROM_EMAIL,
    html: emailHtml,
    text: emailText,
  };

  return params;
}

export default function AccountRestoredTemplate({
  email,
  userName,
}: {
  email: string;
  userName?: string;
}) {
  const appUrl = `${env.NEXT_PUBLIC_DEPLOYMENT_URL}/app`;

  return (
    <EmailHtml>
      <Head />
      <Preview>Your Complēre account has been successfully restored</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Heading>Welcome Back! Your Account Has Been Restored</Heading>
          {userName && <Text style={{ fontSize: "16px" }}>Hi {userName},</Text>}
          
          <Section style={{ 
            marginTop: "20px", 
            marginBottom: "24px",
            padding: "20px",
            backgroundColor: "#f0fdf4",
            borderRadius: "8px",
            borderLeft: "4px solid #22c55e",
          }}>
            <Text style={{ margin: "0 0 8px 0", fontWeight: "bold", fontSize: "16px" }}>
              Your Account Is Active Again
            </Text>
            <Text style={{ margin: "0", fontSize: "15px", lineHeight: "22px" }}>
              We're pleased to confirm that your Complēre account has been successfully restored. 
              Your personal workspace and analyses are now accessible, and you can resume your work immediately.
            </Text>
          </Section>

          <Section style={{ 
            marginTop: "20px", 
            marginBottom: "20px",
            padding: "16px",
            backgroundColor: "#f8fafc",
            borderRadius: "8px",
            border: "1px solid #e2e8f0"
          }}>
            <Text style={{ margin: "0 0 12px 0", fontWeight: "bold", fontSize: "15px" }}>
              What Has Been Restored:
            </Text>
            <ul style={{ margin: "0", paddingLeft: "20px", fontSize: "14px", lineHeight: "22px" }}>
              <li>Your personal workspace and all analyses</li>
              <li>Your account settings and preferences</li>
              <li>Access to the platform</li>
            </ul>
          </Section>

          <Section style={{ 
            marginTop: "20px", 
            marginBottom: "24px",
            padding: "16px",
            backgroundColor: "#fef2f2",
            borderRadius: "8px",
            borderLeft: "4px solid #dc2626",
          }}>
            <Text style={{ margin: "0 0 8px 0", fontWeight: "bold", fontSize: "14px" }}>
              Important: What Could Not Be Restored
            </Text>
            <Text style={{ margin: "0", fontSize: "14px", lineHeight: "20px", color: "#991b1b" }}>
              Your chat conversations were permanently deleted as part of the account deletion process 
              (in compliance with GDPR right to erasure) and cannot be recovered. However, all your 
              analyses and project data have been fully restored.
            </Text>
          </Section>
          
          <Section style={{ 
            marginTop: "20px", 
            marginBottom: "24px",
            padding: "16px",
            backgroundColor: "#fef9c3",
            borderRadius: "8px",
            borderLeft: "4px solid #eab308",
          }}>
            <Text style={{ margin: "0 0 8px 0", fontWeight: "bold", fontSize: "14px" }}>
              Organization Memberships
            </Text>
            <Text style={{ margin: "0", fontSize: "14px", lineHeight: "20px", color: "#713f12" }}>
              Your organization memberships were removed during account deletion. You'll need to rejoin 
              organizations or create a new personal workspace. Please visit the onboarding page to set this up.
            </Text>
          </Section>

          <Text style={{ fontSize: "16px", lineHeight: "24px" }}>
            Click the button below to access your account and get started:
          </Text>

          <Section style={styles.buttonContainer}>
            <Button style={styles.button} href={appUrl}>
              Access Your Account
            </Button>
          </Section>

          <Text style={{ fontSize: "16px", lineHeight: "24px", marginTop: "24px" }}>
            We're glad to have you back! If you have any questions, need assistance, or would like 
            to discuss your account restoration, please don't hesitate to contact us at support@complere.ai
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

AccountRestoredTemplate.PreviewProps = {
  email: "user@example.com",
  userName: "John Doe",
};