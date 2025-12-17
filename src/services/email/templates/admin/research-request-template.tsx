import { env } from "@/create-env";
import {
  ADMINS_EMAILS_STRING,
  SEND_FROM_EMAIL,
  SUPPORT_EMAIL,
} from "@/services/email/config";
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
import { Footer } from "../../components/footer";
import styles from "../../components/styles";

export interface ResearchRequestTemplateProps {
  // Existing fields
  userEmail: string;
  subjectTitle: string;
  subjectContext: string;
  requestContext?: string;
  subjectId: string;
  userName?: string;

  // New fields to add
  contactName?: string;
  contactEmail?: string;
  organization?: string;
  researchTitle?: string;
  researchObjective?: string;
  sectorFocus?: string;
  selectedService?: string;
  withExpertReview?: boolean;
  subjectDocuments?: Array<{
    name: string;
    url: string;
    fileType: string;
  }>;
  requestDocuments?: Array<{
    name: string;
    url: string;
    fileType: string;
  }>;
}

const SUBJECT_URL = `${env.NEXT_PUBLIC_DEPLOYMENT_URL}/app/subject`;

export async function getResearchRequestParams(
  props: ResearchRequestTemplateProps,
): Promise<CreateEmailOptions> {
  const emailHtml = await render(<ResearchRequestTemplate {...props} />);
  const emailText = await render(<ResearchRequestTemplate {...props} />, {
    plainText: true,
  });

  const params: CreateEmailOptions = {
    subject: `New Research Request: ${props.researchTitle || props.subjectTitle || "Research Request"} 📊`,
    to: SUPPORT_EMAIL,
    cc: ADMINS_EMAILS_STRING,
    from: SEND_FROM_EMAIL,
    html: emailHtml,
    text: emailText,
  };

  return params;
}

export default function ResearchRequestTemplate({
  userEmail,
  subjectTitle,
  subjectContext,
  requestContext,
  subjectId,
  userName,
  contactName,
  contactEmail,
  organization,
  researchTitle,
  researchObjective,
  sectorFocus,
  selectedService,
  withExpertReview,
  subjectDocuments,
  requestDocuments,
}: ResearchRequestTemplateProps) {
  const subjectUrl =
    subjectId !== "standalone" ? `${SUBJECT_URL}/${subjectId}` : null;
  const displayName =
    contactName || userName || userEmail.split("@")[0] || "User";
  const isSubjectBased = subjectId !== "standalone";

  // Service package details
  const getServiceDetails = (service?: string) => {
    switch (service) {
      case "expanded":
        return {
          name: "Expanded Research",
          price: "$1,200",
          timeline: "3-5 business days",
        };
      case "expanded-plus-expert":
        return {
          name: "Expanded Research + Expert Review",
          price: "$2,500",
          timeline: "10-14 business days",
        };
      default:
        return {
          name: "Service package not specified",
          price: "TBD",
          timeline: "TBD",
        };
    }
  };

  const serviceDetails = getServiceDetails(selectedService);

  return (
    <EmailHtml>
      <Head />
      <Preview>
        New research request from {displayName}:{" "}
        {researchTitle || subjectTitle || "Research Request"}
      </Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Heading style={styles.heading}>New Research Request</Heading>

          <Section>
            <Text style={styles.bold}>Action Required</Text>
            <Text>
              A user has submitted a request for detailed research analysis
              through Complēre.
            </Text>
          </Section>

          {/* Enhanced User Details Section */}
          <Section>
            <Text style={styles.bold}>Contact Details</Text>
            <Text>Name: {displayName}</Text>
            <Text>
              Email:{" "}
              <Link href={`mailto:${contactEmail || userEmail}`}>
                {contactEmail || userEmail}
              </Link>
            </Text>
            {contactEmail && contactEmail !== userEmail && (
              <Text>
                User Account:{" "}
                <Link href={`mailto:${userEmail}`}>{userEmail}</Link>
              </Text>
            )}
            {organization && <Text>Organization: {organization}</Text>}
          </Section>

          {/* Service Details Section */}
          <Section>
            <Text style={styles.bold}>Service Package</Text>
            <Text>Package: {serviceDetails.name}</Text>
            <Text>Estimated Price: {serviceDetails.price}</Text>
            <Text>Timeline: {serviceDetails.timeline}</Text>
            {withExpertReview !== undefined && (
              <Text>Expert Review: {withExpertReview ? "Yes" : "No"}</Text>
            )}
          </Section>

          {/* Enhanced Research Details Section */}
          <Section>
            <Text style={styles.bold}>Research Details</Text>
            {researchTitle && <Text>Title: {researchTitle}</Text>}
            {researchObjective && <Text>Objective: {researchObjective}</Text>}
            {sectorFocus && <Text>Sector Focus: {sectorFocus}</Text>}
            {requestContext && (
              <>
                <Text style={styles.bold}>Research Questions:</Text>
                <Text>{requestContext}</Text>
              </>
            )}
          </Section>

          {/* Subject Context Section (only for subject-based requests) */}
          {isSubjectBased && (
            <Section>
              <Text style={styles.bold}>Original Subject Analysis</Text>
              <Text>Title: {subjectTitle || "Subject Analysis"}</Text>
              <Text>Context: {subjectContext}</Text>
            </Section>
          )}

          {/* Document Access Section */}
          <Section>
            <Text style={styles.bold}>Document Access</Text>

            {/* Subject Documents (only for subject-based requests) */}
            {isSubjectBased && (
              <>
                <Text style={styles.bold}>
                  Documents from Original Subject Analysis:
                </Text>
                {subjectDocuments && subjectDocuments.length > 0 ? (
                  subjectDocuments.map((doc, index) => (
                    <Text key={index}>
                      • <Link href={doc.url}>{doc.name}</Link> ({doc.fileType})
                    </Text>
                  ))
                ) : (
                  <Text>No subject documents available</Text>
                )}
              </>
            )}

            {/* Request Documents */}
            <Text style={styles.bold}>
              Documents Uploaded with Research Request:
            </Text>
            {requestDocuments && requestDocuments.length > 0 ? (
              requestDocuments.map((doc, index) => (
                <Text key={index}>
                  • <Link href={doc.url}>{doc.name}</Link> ({doc.fileType})
                </Text>
              ))
            ) : (
              <Text>
                No additional documents were provided with this request
              </Text>
            )}

            {((subjectDocuments && subjectDocuments.length > 0) ||
              (requestDocuments && requestDocuments.length > 0)) && (
              <Text style={{ fontSize: "12px", color: "#666" }}>
                ⚠️ Document links expire in 7 days
              </Text>
            )}
          </Section>

          {/* Updated Next Steps Section */}
          <Section>
            <Text style={styles.bold}>Next Steps</Text>
            <Text>
              • Review the research request and any uploaded documents
            </Text>
            {isSubjectBased && (
              <Text>• Review the original subject analysis for context</Text>
            )}
            <Text>
              • Contact the user to discuss scope and specific requirements
            </Text>
            <Text>
              • Provide a detailed quote based on the{" "}
              {serviceDetails.name.toLowerCase()} package
            </Text>
            {selectedService === "expanded-plus-expert" && (
              <Text>
                • Coordinate expert reviewer assignment for this request
              </Text>
            )}
            <Text>• Set timeline expectations based on current workload</Text>
          </Section>

          {/* Action Buttons */}
          <Section style={styles.buttonContainer}>
            {subjectUrl && (
              <Button style={styles.button} href={subjectUrl}>
                Review Subject & Analysis
              </Button>
            )}
          </Section>

          <Footer />
        </Container>
      </Body>
    </EmailHtml>
  );
}

ResearchRequestTemplate.PreviewProps = {
  userEmail: "kevin@complere.ai",
  subjectTitle: "Educational Program Evaluation",
  subjectContext:
    "Analysis of a K-12 STEM education program to assess effectiveness and student outcomes.",
  requestContext:
    "We need detailed analysis focusing on long-term student engagement metrics and comparison with traditional programs.",
  subjectId: "clx123456789",
  userName: "Kevin Doran",
  contactName: "Dr. Sarah Johnson",
  contactEmail: "s.johnson@education-foundation.org",
  organization: "National Education Foundation",
  researchTitle: "STEM Program Impact Assessment",
  researchObjective:
    "Evaluate the long-term effectiveness of our K-12 STEM education program on student outcomes and career paths",
  sectorFocus: "education",
  selectedService: "expanded-plus-expert",
  withExpertReview: true,
  subjectDocuments: [
    {
      name: "initial-program-analysis.pdf",
      url: "https://example.com/doc1",
      fileType: "PDF",
    },
  ],
  requestDocuments: [
    {
      name: "additional-requirements.docx",
      url: "https://example.com/doc2",
      fileType: "DOCX",
    },
    {
      name: "budget-constraints.xlsx",
      url: "https://example.com/doc3",
      fileType: "XLSX",
    },
  ],
} as ResearchRequestTemplateProps;
