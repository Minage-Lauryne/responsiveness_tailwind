"use client";

import {
  BarChart,
  Brain,
  CheckCircle,
  ClipboardCheck,
  Globe,
  Newspaper,
  Users,
  Video,
} from "lucide-react";
import { Solution } from "./solution-section";

export function Solutions() {
  return (
    <>
      <Solution
        id="toolkit"
        label="Useful tools that grantmakers can trust"
        heading="Secure access to curated research"
        description="Complēre gives users secure access to curated research, with the flexibility to limit analysis to trusted sources or include broader web results. You can safely upload your own information to generate faster, more informed, and nuanced decisions."
        imageOnLeft={true}
        image={{
          src: "/brand/image01-resized.jpg",
          alt: "Toolkit",
          width: 974,
          height: 974,
        }}
        features={[
          {
            icon: Brain,
            title: "Insight Assistant",
            description:
              "Combine the power of research and evaluation to improve funding decisions with speed and rigor. This assistant summarizes proposals, aligns them with thousands of vetted studies, and surfaces insights to help funders and nonprofits validate, strengthen, or rethink their approaches using trusted, poverty-focused evidence.",
          },
          {
            icon: ClipboardCheck,
            title: "Planning Assistant",
            description:
              "Streamline strategic planning by reducing prep time and providing interactive dashboards that support real-time collaboration. Leaders and teams can align on goals, assess trade-offs, and move from planning to execution with greater clarity and confidence.",
          },
          {
            icon: CheckCircle,
            title: "Critical Companion & Bias Checker",
            description:
              "Ensure your insights are not just repeated but interrogated. This tool cross-checks AI outputs for potential bias, offers alternative perspectives, surfaces counterpoints, and poses critical questions—helping users make more thoughtful, well-rounded decisions.",
          },
          {
            icon: Globe,
            title: "Nonprofit Access Portal",
            description:
              "Register to access the same curated research and planning tools that funders use—designed to help nonprofits strengthen their programming, make informed decisions, and achieve the results they seek.",
          },
        ]}
      />

      <Solution
        id="research"
        background="gray"
        label="Research Projects"
        heading="Expert-Guided Deep Research"
        description="Complēre brings trusted research and materials inside its AI workflows. Within the platform, you can launch a research project and request review from independent subject matter experts."
        imageOnLeft={false}
        image={{
          src: "/brand/image02.png",
          alt: "Research",
          width: 500,
          height: 400,
        }}
        features={[
          {
            icon: BarChart,
            title: "Expert-Guided Deep Research",
            description:
              "Gain strategic depth and breadth on any topic—fast and cost-effectively. Work with a human expert to review AI-generated insights and receive high-quality research without the usual time and expense. Just fill out a research input form and opt for expert review.",
          },
          {
            icon: Users,
            title: "Our Research Team",
            description:
              "Our consulting researchers hold master's or PhDs and bring 10+ years of experience from top universities and national and international institutions.",
          },
          {
            icon: ClipboardCheck,
            title: "Working With Us",
            description:
              "Need answers and comprehensive research without steep costs? Traditional research partners often charge $10,000 to six figures, but our tool provides affordable solutions to complex questions on an efficient timeline.",
          },
        ]}
      />

      <Solution
        id="resources"
        background="gradient"
        label="AI Training & Resources"
        heading="Learn to leverage AI in foundation work"
        description="Access a comprehensive library of resources and training materials designed to help foundation staff effectively integrate AI into their daily workflows."
        imageOnLeft={true}
        image={{
          src: "/brand/image03.jpg",
          alt: "Resources",
          width: 500,
          height: 500,
        }}
        features={[
          {
            icon: Video,
            title: "Recorded Workshops",
            description:
              "Explore our suite of recorded workshops covering fundamental and advanced AI applications for foundation work. Sessions include practical demonstrations, case studies, and expert insights to help you confidently implement AI tools in your organization.",
          },
          {
            icon: Newspaper,
            title: "Articles & Guides",
            description:
              "Access our collection of in-depth articles, best practice guides, and implementation frameworks specifically designed for foundation professionals. Our resources provide actionable insights on ethical AI use, effective prompt engineering, and maximizing AI's potential in philanthropic work.",
          },
        ]}
      />
    </>
  );
}
