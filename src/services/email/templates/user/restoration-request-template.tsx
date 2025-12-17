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

interface RestorationRequestParams {
  userName: string;
  userEmail: string;
  requestedAt: Date;
}

export async function getRestorationRequestTemplateParams(
  email: string,
  userName: string | undefined,
  params: RestorationRequestParams,
) {
  const emailHtml = await render(<RestorationRequestTemplate {...params} />);
  const emailText = await render(<RestorationRequestTemplate {...params} />, {
    plainText: true,
  });

  const emailParams: CreateEmailOptions = {
    subject: `Account Restoration Request from ${params.userName}`,
    to: email,
    from: SEND_FROM_EMAIL,
    html: emailHtml,
    text: emailText,
  };

  return emailParams;
}

export default function RestorationRequestTemplate({
  userName,
  userEmail,
  requestedAt,
}: RestorationRequestParams) {
  const adminDashboardUrl = `${env.NEXT_PUBLIC_DEPLOYMENT_URL}/app/admin/restoration-requests`;

  return (
    <EmailHtml>
      <Head />
      <Preview>New account restoration request from {userName}</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Heading>New Account Restoration Request</Heading>
          
          <Text style={{ fontSize: "16px", lineHeight: "24px" }}>
            A user has submitted a request to restore their deleted account and regain access to 
            their personal workspace and analyses.
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
              <strong>Request Time:</strong>{" "}
              {formatDistanceToNow(new Date(requestedAt), { addSuffix: true })}
            </Text>
          </Section>

          <Text style={{ fontSize: "16px", lineHeight: "24px" }}>
            Please review this request in the admin dashboard. You can approve the restoration to 
            recover the user's account and analyses, or decline it with an explanation if the request 
            cannot be approved.
          </Text>

          <Section style={styles.buttonContainer}>
            <Button style={styles.button} href={adminDashboardUrl}>
              Review Request in Dashboard
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

RestorationRequestTemplate.PreviewProps = {
  userName: "John Doe",
  userEmail: "user@example.com",
  requestedAt: new Date(),
};