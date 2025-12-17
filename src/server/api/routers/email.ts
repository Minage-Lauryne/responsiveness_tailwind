import { z } from "zod";
import { Resend } from "resend";
import { generateAnalysisPdf } from "@/server/pdf/generateAnalysisPdf";
import { db } from "@/server/db";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

const resend = new Resend(process.env.RESEND_API_KEY);
const FALLBACK_FROM = "Complere <noreply@updates.complere.ai>";

export const emailRouter = createTRPCRouter({
  send: publicProcedure
    .input(
      z.object({
        email: z.string().email("Please enter a valid email address."),
        senderEmail: z.string().optional(),
        organizationId: z.string(),
        subjectId: z.string(),
        analysisType: z.string().default("General Analysis"),
      })
    )
    .mutation(async ({ input }) => {
      const { email, senderEmail, organizationId, subjectId, analysisType } = input;

      const recipient = email.trim();
      const sender = (senderEmail || "").trim().toLowerCase();
      const fromAddress = `noreply@updates.complere.ai`;

      const organization = await db.organization.findUnique({
        where: { id: organizationId },
        select: { name: true },
      });

      const org = organization?.name || "Complere";

      if (analysisType === "General Analysis") {
        const { buffer, fileName, subjectTitle } = await generateAnalysisPdf(subjectId, analysisType);

        let fromHeader = FALLBACK_FROM;
        let replyToHeader: string | undefined = sender;

        try {
          const domainsResp = await resend.domains.list();

          const domains = Array.isArray(domainsResp.data) ? domainsResp.data : [];


          const verified = domains.some(
            (d) =>
              (d.domain === "updates.complere.ai" || d.name === "updates.complere.ai") &&
              d.is_verified === true
          );

          if (verified) {
            fromHeader = `${org} <${fromAddress}>`;
            replyToHeader = sender;
          } else {
            console.warn("updates.complere.ai is not verified in Resend — using fallback sender");
          }
        } catch (error) {
          console.warn("Resend domain check failed:", error);
        }


        const name = recipient.split("@")[0] || "there";
        const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);

        const cleanTitle = subjectTitle?.replace(/^#+\s*/, "").trim();

        const html = `
        <p>Hello ${capitalizedName},</p>
        <p><strong>${org}</strong> has shared a new <strong>${cleanTitle}</strong> report with you.</p>
        <p>This report covers the following areas:</p>
        <ul>
          <li>Initial Analysis</li>
          <li>Gather Additional Perspective</li>
          <li>Landscape Analysis</li>
        </ul>
        <p>Please take a moment to review the insights and findings included.</p>
        <p>Best regards,<br/>${org} Team</p>
      `;

        const sendResult = await resend.emails.send({
          from: fromHeader,
          to: recipient,
          subject: `Analysis Report from ${org}`,
          html,
          attachments: [
            {
              filename: fileName,
              content: buffer.toString("base64"),
              contentType: "application/pdf",
            },
          ],
          replyTo: replyToHeader,
        });



        return { success: true, provider: "resend", sendResult };
      } else {
        throw new Error(`PDF generation for "${analysisType}" is not yet implemented.`);
      }
    }),
  
  sendAnalysisEmail: publicProcedure
    .input(
      z.object({
        recipientEmail: z.string().email("Please enter a valid email address."),
        senderEmail: z.string(),
        organizationId: z.string(),
        subjectTitle: z.string(),
        analysisTitle: z.string(),
        pdfBase64: z.string(),
        pdfFilename: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const {
        recipientEmail,
        senderEmail,
        organizationId,
        subjectTitle,
        analysisTitle,
        pdfBase64,
        pdfFilename,
      } = input;

      const recipient = recipientEmail.trim();
      const sender = senderEmail.trim().toLowerCase();
      const fromAddress = `noreply@updates.complere.ai`;

      const organization = await db.organization.findUnique({
        where: { id: organizationId },
        select: { name: true },
      });

      const org = organization?.name || "Complere";

      let fromHeader = FALLBACK_FROM;
      let replyToHeader: string | undefined = sender;

      try {
        const domainsResp = await resend.domains.list();
        const domains = Array.isArray(domainsResp.data) ? domainsResp.data : [];

        const verified = domains.some(
          (d) =>
            (d.domain === "updates.complere.ai" || d.name === "updates.complere.ai") &&
            d.is_verified === true
        );

        if (verified) {
          fromHeader = `${org} <${fromAddress}>`;
          replyToHeader = sender;
        } else {
          console.warn("updates.complere.ai is not verified in Resend — using fallback sender");
        }
      } catch (error) {
        console.warn("Resend domain check failed:", error);
      }

      const name = recipient.split("@")[0] || "there";
      const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);

      const html = `
        <p>Hello ${capitalizedName},</p>
        <p><strong>${org}</strong> has shared a new <strong>${analysisTitle}</strong> report with you.</p>
        <p><strong>Subject:</strong> ${subjectTitle}</p>
        <p>Please take a moment to review the insights and findings included in the attached PDF.</p>
        <p>Best regards,<br/>${org} Team</p>
      `;

      const sendResult = await resend.emails.send({
        from: fromHeader,
        to: recipient,
        subject: `${analysisTitle} Report from ${org}`,
        html,
        attachments: [
          {
            filename: pdfFilename,
            content: pdfBase64,
            contentType: "application/pdf",
          },
        ],
        replyTo: replyToHeader,
      });

      return { success: true, provider: "resend", sendResult };
    }),
});