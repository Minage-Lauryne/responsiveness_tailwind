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

type InviterData = {
  name: string;
  workspaceName: string;
};

export async function getInviteToWorkspaceParams({
  email,
  inviter,
}: {
  email: string;
  inviter: InviterData;
}) {
  const emailHtml = await render(
    <InviteToWorkspaceTemplate
      email={email}
      inviterName={inviter.name}
      workspaceName={inviter.workspaceName}
    />,
  );
  const emailText = await render(
    <InviteToWorkspaceTemplate
      email={email}
      inviterName={inviter.name}
      workspaceName={inviter.workspaceName}
    />,
    {
      plainText: true,
    },
  );

  const params: CreateEmailOptions = {
    subject: getWelcomeSubject(inviter),
    to: email,
    from: SEND_FROM_EMAIL,
    html: emailHtml,
    text: emailText,
  };

  return params;
}

function getWelcomeSubject(inviter: InviterData) {
  return inviter.name
    ? `${inviter.name} has invited you to join their workspace ${inviter.workspaceName} at Complēre`
    : `You have been invited to join the workspace ${inviter.workspaceName} at Complēre`;
}

export default function InviteToWorkspaceTemplate({
  email,
  inviterName,
  workspaceName,
}: {
  email: string;
  inviterName: string;
  workspaceName: string;
}) {
  const userUrl = `${env.NEXT_PUBLIC_DEPLOYMENT_URL}/app?email=${encodeURIComponent(email)}`;

  return (
    <EmailHtml>
      <Head />
      <Preview>You have been invited to join a workspace on Complēre </Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Heading>Welcome to Complere!</Heading>
          <Text>
            {inviterName} has invited you to join the workspace: {workspaceName}
          </Text>
          <Text>You may get started here: </Text>
          <Section style={styles.buttonContainer}>
            <Button style={styles.button} href={userUrl}>
              Get Started
            </Button>
          </Section>

          <Text>Excited to have you onboard!</Text>
          <Footer />
        </Container>
      </Body>
    </EmailHtml>
  );
}

InviteToWorkspaceTemplate.PreviewProps = {
  email: "kev.doran@test.com",
  workspaceName: "Test Workspace",
  inviterName: "Kevin",
};
