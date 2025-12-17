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

export async function getBetaUserTemplateParams(
  email: string,
  userName?: string,
) {
  const emailHtml = await render(
    <BetaUserTemplate email={email} userName={userName} />,
  );
  const emailText = await render(
    <BetaUserTemplate email={email} userName={userName} />,
    {
      plainText: true,
    },
  );

  const params: CreateEmailOptions = {
    subject: `You now are a member of Complēre early access`,
    to: email,

    from: SEND_FROM_EMAIL,
    html: emailHtml,
    text: emailText,
  };

  return params;
}

export default function BetaUserTemplate({
  email,
  userName,
}: {
  email: string;
  userName?: string;
}) {
  const userUrl = `${env.NEXT_PUBLIC_DEPLOYMENT_URL}/app?email=${encodeURIComponent(email)}`;

  return (
    <EmailHtml>
      <Head />
      <Preview>You now are a member of early access 🎉</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Heading>You now are a member of early access 🎉</Heading>
          {userName && <Text>{userName},</Text>}
          <Text>
            Welcome to early access, Complere. You may get started here:{" "}
          </Text>
          <Section style={styles.buttonContainer}>
            <Button style={styles.button} href={userUrl}>
              Get Started
            </Button>
          </Section>

          <Text>
            If you're not already signed in, you'll need to sign in again with
            this same email, {email}.
          </Text>

          <Text>We are excited to have you onboard!</Text>
          <Text>Complēre</Text>
          <Footer />
        </Container>
      </Body>
    </EmailHtml>
  );
}

BetaUserTemplate.PreviewProps = {
  email: "kev.doran@test.com",
  userName: "Kevin",
};
