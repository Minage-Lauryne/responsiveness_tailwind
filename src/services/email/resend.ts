import { env } from "@/create-env";
import { CreateEmailOptions, Resend } from "resend";
import "server-only";
import { SEND_FROM_EMAIL, SUPPORT_EMAIL } from "./config";
export const resend = new Resend(env.RESEND_API_KEY);
export async function sendEmail(email: string, subject: string, html: string) {
  await resend.emails.send({
    from: SEND_FROM_EMAIL,
    replyTo: SUPPORT_EMAIL,
    to: email,
    subject: subject,
    html: html,
  });
}
export async function sendMail<Args extends unknown[]>(
  paramsGenerator: (...args: Args) => Promise<CreateEmailOptions>,
  ...args: Args
) {
  const message = await paramsGenerator(...args);
  const result = await resend.emails.send({
    replyTo: SUPPORT_EMAIL,
    ...message,
  });
  if (result.error) {
    if (
      result.error.message.includes('fetch')
    ) {
      throw new Error('There’s an issue with your internet connection. Please check your connection and try again.');
    } else {
      throw new Error(`Email service error: ${result.error.message}`);
    }
  }
  return result;
}

