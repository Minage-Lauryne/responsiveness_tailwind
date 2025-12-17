import { env } from "@/create-env";
import { SEND_FROM_EMAIL } from "@/services/email/config";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html as EmailHtml,
  Link,
  Preview,
  Section,
  Text,
  render,
} from "@react-email/components";
import { CreateEmailOptions } from "resend";
import { Footer } from "../components/footer";
import styles from "../components/styles";

export interface ProjectInvitationTemplateProps {
  projectName: string;
  invitedByName: string;
  projectUrl: string;
  toEmail: string;
}

const PROJECT_URL = `${env.NEXT_PUBLIC_DEPLOYMENT_URL}/app/projects`;

export async function getProjectInvitationParams(
  props: ProjectInvitationTemplateProps,
): Promise<CreateEmailOptions> {
  const emailHtml = await render(<ProjectInvitationTemplate {...props} />);
  const emailText = await render(<ProjectInvitationTemplate {...props} />, {
    plainText: true,
  });

  const params: CreateEmailOptions = {
    subject: `You've been invited to collaborate on ${props.projectName} 🎉`,
    to: props.toEmail,
    from: SEND_FROM_EMAIL,
    html: emailHtml,
    text: emailText,
  };

  return params;
}

export default function ProjectInvitationTemplate({
  projectName,
  invitedByName,
  projectUrl,
}: ProjectInvitationTemplateProps) {
  return (
    <EmailHtml>
      <Head />
      <Preview>You've been invited to collaborate on {projectName}</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Heading style={styles.heading}>Project Invitation</Heading>

          <Section>
            <Text>
              {invitedByName} has invited you to collaborate on the project{" "}
              <strong>{projectName}</strong>.
            </Text>
          </Section>

          <Section>
            <Text>Click below to view the project:</Text>
          </Section>

          <Section style={styles.buttonContainer}>
            <Button style={styles.button} href={projectUrl}>
              View Project
            </Button>
          </Section>

          <Footer />
        </Container>
      </Body>
    </EmailHtml>
  );
}

ProjectInvitationTemplate.PreviewProps = {
  projectName: "Research Study Analysis",
  invitedByName: "Kevin Doran",
  projectUrl: PROJECT_URL,
  toEmail: "collaborator@example.com",
} as ProjectInvitationTemplateProps;
