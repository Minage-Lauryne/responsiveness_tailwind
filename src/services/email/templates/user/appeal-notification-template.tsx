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
import { formatDistanceToNow } from "date-fns";

interface AppealNotificationParams {
  userName: string;
  userEmail: string;
  appealMessage: string;
  rejectionReason: string;
  appealedAt: Date;
}

export async function getAppealNotificationTemplateParams(
  email: string,
  userName: string | undefined,
  params: AppealNotificationParams,
) {
  const emailHtml = await render(<AppealNotificationTemplate {...params} />);
  const emailText = await render(<AppealNotificationTemplate {...params} />, {
    plainText: true,
  });

  const emailParams: CreateEmailOptions = {
    subject: `Account Restoration Appeal from ${params.userName}`,
    to: email,
    from: SEND_FROM_EMAIL,
    html: emailHtml,
    text: emailText,
  };

  return emailParams;
}

export default function AppealNotificationTemplate({
  userName,
  userEmail,
  appealMessage,
  rejectionReason,
  appealedAt,
}: AppealNotificationParams) {
  const adminDashboardUrl = `${env.NEXT_PUBLIC_DEPLOYMENT_URL}/app/admin/restoration-requests`;

  return (
    <EmailHtml>
      <Head />
      <Preview>Account restoration appeal from {userName}</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Heading>New Appeal for Account Restoration</Heading>
          
          <Text style={{ fontSize: "16px", lineHeight: "24px" }}>
            A user has submitted an appeal for their previously rejected account restoration request. 
            They have provided additional context and information for your consideration.
          </Text>

          <Section style={{ 
            marginTop: "20px", 
            marginBottom: "24px",
            padding: "20px",
            backgroundColor: "#f8fafc",
            borderRadius: "8px",
            border: "1px solid #e2e8f0"
          }}>
            <Text style={{ margin: "0 0 8px 0", fontWeight: "bold", fontSize: "15px", color: "#475569" }}>
              User Details:
            </Text>
            <Text style={{ margin: "8px 0", fontSize: "15px" }}>
              <strong>Name:</strong> {userName}
            </Text>
            <Text style={{ margin: "8px 0", fontSize: "15px" }}>
              <strong>Email:</strong> {userEmail}
            </Text>
            <Text style={{ margin: "8px 0", fontSize: "15px" }}>
              <strong>Appeal Submitted:</strong>{" "}
              {formatDistanceToNow(new Date(appealedAt), { addSuffix: true })}
            </Text>
          </Section>

          <Section style={{ 
            marginTop: "20px", 
            marginBottom: "20px",
            padding: "20px",
            backgroundColor: "#fef2f2",
            borderRadius: "8px",
            borderLeft: "4px solid #dc2626",
          }}>
            <Text style={{ margin: "0 0 12px 0", fontWeight: "bold", fontSize: "15px" }}>
              Original Rejection Reason:
            </Text>
            <Text style={{ margin: "0", fontSize: "14px", lineHeight: "20px" }}>
              {rejectionReason}
            </Text>
          </Section>

          <Section style={{ 
            marginTop: "20px", 
            marginBottom: "24px",
            padding: "20px",
            backgroundColor: "#eff6ff",
            borderRadius: "8px",
            borderLeft: "4px solid #2563eb",
          }}>
            <Text style={{ margin: "0 0 12px 0", fontWeight: "bold", fontSize: "15px" }}>
              User's Appeal:
            </Text>
            <Text style={{ margin: "0", whiteSpace: "pre-wrap", fontSize: "14px", lineHeight: "20px" }}>
              {appealMessage}
            </Text>
          </Section>

          <Text style={{ fontSize: "16px", lineHeight: "24px" }}>
            Please review this appeal in the admin dashboard. You can approve the restoration 
            to recover their account, or reject the appeal if the additional information doesn't 
            change the decision. The user's 30-day grace period is still active.
          </Text>

          <Section style={styles.buttonContainer}>
            <Button style={styles.button} href={adminDashboardUrl}>
              Review Appeal in Dashboard
            </Button>
          </Section>

          <Text style={{ fontSize: "16px", marginTop: "24px" }}>
            Best regards,<br />
            Complēre Admin System
          </Text>
          <Footer />
        </Container>
      </Body>
    </EmailHtml>
  );
}

AppealNotificationTemplate.PreviewProps = {
  userName: "John Doe",
  userEmail: "user@example.com",
  appealMessage: "I accidentally deleted my account while trying to update my settings. I have important analyses that I need for an upcoming presentation. I would really appreciate the opportunity to have my account restored.",
  rejectionReason: "We were unable to verify the account ownership based on the information provided.",
  appealedAt: new Date(),
};