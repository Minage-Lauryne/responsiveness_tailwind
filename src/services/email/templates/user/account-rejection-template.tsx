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

interface AccountRejectionParams {
  rejectionReason: string;
  rejectedAt: Date;
  isAppealRejection?: boolean;
}

export async function getAccountRejectionTemplateParams(
  email: string,
  userName: string | undefined,
  params: AccountRejectionParams,
) {
  const emailHtml = await render(
    <AccountRejectionTemplate 
      email={email} 
      userName={userName} 
      {...params}
    />
  );
  const emailText = await render(
    <AccountRejectionTemplate 
      email={email} 
      userName={userName} 
      {...params}
    />,
    {
      plainText: true,
    },
  );

  const emailParams: CreateEmailOptions = {
    subject: `Your account restoration request has been reviewed`,
    to: email,
    from: SEND_FROM_EMAIL,
    html: emailHtml,
    text: emailText,
  };

  return emailParams;
}

export default function AccountRejectionTemplate({
  email,
  userName,
  rejectionReason,
  rejectedAt,
  isAppealRejection = false,
}: {
  email: string;
  userName?: string;
} & AccountRejectionParams) {
  const restoreUrl = `${env.NEXT_PUBLIC_DEPLOYMENT_URL}/account/restore`;

  return (
    <EmailHtml>
      <Head />
      <Preview>
        {isAppealRejection 
          ? "Your appeal has been reviewed" 
          : "Your account restoration request has been reviewed"}
      </Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Heading>
            {isAppealRejection 
              ? "Decision on Your Account Restoration Appeal" 
              : "Decision on Your Account Restoration Request"}
          </Heading>
          {userName && <Text style={{ fontSize: "16px" }}>Hi {userName},</Text>}
          
          <Text style={{ fontSize: "16px", lineHeight: "24px" }}>
            Thank you for taking the time to submit your {isAppealRejection ? "appeal" : "restoration request"}. 
            We understand how important this matter is to you.
          </Text>
          
          <Text style={{ fontSize: "16px", lineHeight: "24px" }}>
            {isAppealRejection 
              ? "After carefully reviewing your appeal and the additional information you provided, we regret to inform you that we must uphold our original decision and cannot restore your account."
              : "After careful review of your request, we regret to inform you that we are unable to restore your account at this time."
            }
          </Text>

          <Section style={{ 
            marginTop: "20px", 
            marginBottom: "24px",
            padding: "20px",
            backgroundColor: "#fef2f2",
            borderRadius: "8px",
            borderLeft: "4px solid #dc2626",
          }}>
            <Text style={{ margin: "0 0 12px 0", fontWeight: "bold", fontSize: "16px" }}>
              {isAppealRejection ? "Reason for Appeal Decision:" : "Reason for This Decision:"}
            </Text>
            <Text style={{ margin: "0", whiteSpace: "pre-wrap", fontSize: "15px", lineHeight: "22px" }}>
              {rejectionReason}
            </Text>
          </Section>

          {!isAppealRejection && (
            <>
              <Section style={{ 
                marginTop: "24px", 
                marginBottom: "24px",
                padding: "20px",
                backgroundColor: "#eff6ff",
                borderRadius: "8px",
                borderLeft: "4px solid #2563eb",
              }}>
                <Text style={{ margin: "0 0 12px 0", fontWeight: "bold", fontSize: "16px" }}>
                  You Have the Right to Appeal
                </Text>
                <Text style={{ margin: "0 0 12px 0", fontSize: "15px", lineHeight: "22px" }}>
                  If you believe this decision was made in error or if you have additional information 
                  that wasn't previously considered, you have <strong>48 hours</strong> from receiving 
                  this email to submit an appeal.
                </Text>
                <Text style={{ margin: "0", fontSize: "14px", lineHeight: "20px" }}>
                  During the appeal, please provide any relevant details, context, or documentation 
                  that supports your case. Our team will thoroughly review all new information you provide.
                </Text>
              </Section>

              <Text style={{ fontSize: "16px", lineHeight: "24px" }}>
                To submit an appeal, log in to your account and visit the account restoration page. 
                You'll be able to provide additional information, and our team will conduct a fresh 
                review of your case.
              </Text>

              <Section style={styles.buttonContainer}>
                <Button style={styles.button} href={restoreUrl}>
                  Submit an Appeal
                </Button>
              </Section>

              <Text style={{ fontSize: "14px", color: "#64748b", lineHeight: "20px" }}>
                <strong>Please note:</strong> If you don't submit an appeal within 48 hours, 
                your account will remain in its current state until the original 30-day grace 
                period expires. After that, all data will be permanently deleted.
              </Text>
            </>
          )}

          {isAppealRejection && (
            <Section style={{ 
              marginTop: "24px", 
              marginBottom: "24px",
              padding: "16px",
              backgroundColor: "#fef2f2",
              borderRadius: "8px",
              borderLeft: "4px solid #dc2626",
            }}>
              <Text style={{ margin: "0", fontSize: "14px", lineHeight: "20px", color: "#991b1b" }}>
                <strong>This is a final decision.</strong> All appeal options have been exhausted, and no 
                further appeals can be submitted. If the 30-day recovery period hasn't yet expired, your data 
                will remain in our systems until that date, after which it will be permanently deleted in 
                accordance with GDPR requirements.
              </Text>
            </Section>
          )}

          <Text style={{ fontSize: "16px", lineHeight: "24px", marginTop: "24px" }}>
            We understand this may not be the outcome you were hoping for, and we appreciate your understanding. 
            If you have questions about this decision or need clarification, please feel free to contact us 
            at support@complere.ai
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

AccountRejectionTemplate.PreviewProps = {
  email: "user@example.com",
  userName: "John Doe",
  rejectionReason: "We were unable to verify the account ownership based on the information provided.",
  rejectedAt: new Date(),
};