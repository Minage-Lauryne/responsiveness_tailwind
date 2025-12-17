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

export async function getOrganizationInvitationParams(
  email: string,
  organizationName: string,
  inviterName: string,
  invitationLink: string,
) {
  if (!email) {
    throw new Error("Email is required");
  }
  if (!organizationName) {
    throw new Error("Organization name is required");
  }
  if (!inviterName) {
    throw new Error("Inviter name is required");
  }
  if (!invitationLink) {
    throw new Error("Invitation link is required");
  }

  const emailHtml = await render(
    <OrganizationInvitationTemplate
      organizationName={organizationName}
      inviterName={inviterName}
      invitationLink={invitationLink}
    />,
  );
  const emailText = await render(
    <OrganizationInvitationTemplate
      organizationName={organizationName}
      inviterName={inviterName}
      invitationLink={invitationLink}
    />,
    {
      plainText: true,
    },
  );

  const params: CreateEmailOptions = {
    subject: `${inviterName} invited you to join ${organizationName} on Complēre`,
    to: email,
    from: SEND_FROM_EMAIL,
    replyTo: "support@complere.ai",
    html: emailHtml,
    text: emailText,
  };

  return params;
}

interface OrganizationInvitationTemplateProps {
  organizationName: string;
  inviterName: string;
  invitationLink: string;
}

export default function OrganizationInvitationTemplate({
  organizationName,
  inviterName,
  invitationLink,
}: OrganizationInvitationTemplateProps) {
  return (
    <EmailHtml>
      <Head />
      <Preview>
        {inviterName} invited you to join {organizationName} on Complēre
      </Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Section>
            <Heading as="h2" style={styles.heading}>
              You're invited to join {organizationName}
            </Heading>
          </Section>

          <Section>
            <Text>
              <strong>{inviterName}</strong> has invited you to join{" "}
              <strong>{organizationName}</strong> on Complēre.
            </Text>
            <Text>
              Complēre is an AI-powered research platform that helps teams
              collaborate and access institutional knowledge.
            </Text>
          </Section>

          <Section style={styles.buttonContainer}>
            <Button href={invitationLink} style={styles.button}>
              Accept Invitation
            </Button>
          </Section>

          <Section>
            <Text>
              If you have any questions, feel free to reach out to our support
              team at support@complere.ai.
            </Text>
          </Section>

          <Section>
            <Text>
              If you didn't expect this invitation, you can safely ignore this
              email.
            </Text>
          </Section>

          <Footer />
        </Container>
      </Body>
    </EmailHtml>
  );
}

OrganizationInvitationTemplate.PreviewProps = {
  organizationName: "Acme Corp",
  inviterName: "John Smith",
  invitationLink: "https://app.complere.ai/invite/abc123",
} as OrganizationInvitationTemplateProps;
