import { ChatType } from "@prisma/client";
import { START_BIAS_PROMPT } from "./bias";
import { BOARD_MEMO_PROMPT } from "./board-memo";

export const customPrompts = [
  {
    name: "Board Memo",
    description:
      "Creates a comprehensive, decision-oriented board memo with funding recommendations, evidence analysis, and implementation considerations.",
    chatType: ChatType.BOARD_MEMO,
    prompt: BOARD_MEMO_PROMPT,
  },
  {
    name: "Comprehensive Report",
    description:
      "Generates an in-depth due diligence report with stakeholder analysis, benefit-cost assessment, and detailed implementation planning.",
    chatType: ChatType.COMPREHENSIVE_REPORT,
    prompt: `
# Comprehensive Report
Create a **Comprehensive Due Diligence Report** for {{Org_Name}}’s {{Program/Proposal}}.

**Deliverables**
- Summary of the identified community need with supporting data.  
- Description of the program: target population, approach, and intended outcomes.  
- Evidence of Effectiveness: what research says about similar interventions, with citations.  
- Organizational Capacity: leadership, governance, staffing, and partnerships.  
- Financial Health: sustainability, risks, and ability to deliver on commitments.  
- Benefit–Cost Perspective: a reasoned narrative of expected benefits relative to costs, noting assumptions.  
- Key Risks & Mitigation Strategies.  
- Learning and Evaluation Plan: suggested metrics and questions to guide future reflection.  
- Options for the decision (e.g., fund, fund with conditions, do not fund) and implications of each.  

Provide information in narrative form, supported by clear bullet lists where helpful.

`,
  },
  {
    name: "Discussion Questions",
    description:
      "Develops targeted discussion questions and decision frameworks for program teams, committees, and boards.",
    chatType: ChatType.DISCUSSION_QUESTIONS,
    prompt: `
# Discussion Questions & Considerations
Generate a set of **Discussion Questions & Considerations** that philanthropy staff or board members can use to deliberate on {{Org_Name}}’s {{Program/Proposal}}.

**Themes**
- Strategic Fit & Community Need  
- Evidence & Outcomes  
- Equity, Power, and Community Voice  
- Financial Health & Sustainability  
- Implementation Risks & Learning  
- Alternative Options & Opportunity Costs  

For each theme, provide 2–3 narrative questions with a brief explanation of why each question matters. Include complementary bullet points to highlight angles the group should explore.

`,
  },
  {
    name: "Financial Analysis",
    description:
      "Conducts comprehensive nonprofit financial health assessment including trends, stress testing, and sustainability analysis.",
    chatType: ChatType.FINANCIAL_ANALYSIS,
    prompt: `
# Financial Analysis
Conduct a **Financial Analysis** of {{Org_Name}}.

**Deliverables**

Narrative summary of the organization's financial position.

Key ratios (liquidity, revenue concentration, operating margins) explained in plain language.

Trends over the past 3–5 years with observations on revenue mix, growth, and volatility.

Budget assessment: how resources align with activities and outcomes.

Risks to sustainability (e.g., dependence on a few funders, cash flow concerns).

Strengths and potential areas for improvement.

Use nonprofit finance best practices as reference points.

**Constraints**
Do not use bullet points. Present all content in narrative paragraph form with clear paragraph breaks between sections.

`,
  },
  {
    name: "Bias Analysis",
    description:
      "Identifies where and how bias—explicit or implicit—may be embedded in the document's framing, data, assumptions, language, and recommendations.",
    chatType: ChatType.BIAS,
    prompt: START_BIAS_PROMPT,
  },
  {
    name: "Leadership Analysis",
    description:
      "Evaluates organizational leadership, governance structure, culture, and capacity for successful program execution.",
    chatType: ChatType.LEADERSHIP_ANALYSIS,
    prompt: `
Leadership Analysis
Conduct a **Leadership and Governance Analysis** of {{Org_Name}}.

**Deliverables**

Narrative assessment of the executive team: stability, relevant expertise, and track record.

Review of the board's composition, governance practices, and representation.

Observations on organizational culture, talent pipeline, and staff wellbeing.

Potential risks (such as key-person dependency or leadership turnover).

Overall readiness of the leadership team to deliver on this proposal.

**Constraints**
Do not use bullet points. Present all content in narrative paragraph form with clear paragraph breaks between sections.

`,
  },
  {
    name: "Program Analysis",
    description:
      "Analyzes program design, evidence alignment, implementation fidelity, and outcome measurement approaches.",
    chatType: ChatType.PROGRAM_ANALYSIS,
    prompt: `
Program Analysis
Prepare a **Program Analysis** for {{Org_Name}}’s {{Program_Name}}.

**Deliverables**
- Clear description of the problem being addressed and the organization’s theory of change.  
- Narrative explanation of how the program aligns with evidence-based practices, with citations.  
- Observations on implementation capacity: staffing, delivery, training, and quality assurance.  
- Assessment of population fit and equity considerations.  
- Outcome and measurement plan: what success will look like and how it can be measured.  

Present findings in a readable narrative with short bullet highlights where needed.

`,
  },
  {
    name: "Relevant Research",
    description:
      "Compiles a comprehensive evidence table of relevant research studies with quality assessments and relevancy analysis.",
    chatType: ChatType.RELEVANT_RESEARCH,
    prompt: `
Relevant Research
Produce a **Narrative Research Review** on {{Issue_Area}} / {{Program_Type}}.

**Deliverables**
- Narrative summary of the most relevant high-quality studies (RCTs, quasi-experimental, or systematic reviews).  
- For each study, provide:  
  - Author(s), year, and title  
  - A short summary of findings  
  - A statement on why this research is relevant to {{Org_Name}}’s context  
  - A link to the study  

List each study in sequence with sub-bullets rather than a table. Conclude by offering to apply these findings directly to the program or strategy analysis if the user wishes.

`,
  },
  {
    name: "Site Visit Prep Guide",
    description:
      "Prepares comprehensive site visit agenda with targeted questions, objectives, and evaluation frameworks.",
    chatType: ChatType.SITE_VISIT_PREP_GUIDE,
    prompt: `
Site Visit Prep Guide
Create a **Site Visit Preparation Guide** for {{Org_Name}}.

**Deliverables**
- Quick organizational overview: mission, population served, program summary.  
- Objectives for the site visit: 3–5 goals the funder should focus on.  
- Suggested agenda for a 90–120 minute visit (who to meet, time allocations).  
- Key questions to ask across topics: program delivery, participant experience, data, finance, partnerships. Each framed with a short “why this matters.”  
- Checklist of documents or materials to request.  
- Red flags and green flags to watch for.  
- Debrief guide: structured notes on what was observed and how it informs the funding decision.  

Use narrative form with bullets for emphasis.

`,
  },
  {
    name: "Strategic Planning Guide",
    description:
      "Develops strategic planning framework with learning questions, portfolio analysis, and implementation roadmaps.",
    chatType: ChatType.STRATEGIC_PLANNING_GUIDE,
    prompt: `
Strategic Planning Guide
Develop a **Strategic Planning Guide** for {{Foundation_Name}}.

**Deliverables**

Framing of strategic goals, constraints, and equity commitments.

Narrative diagnosis of the current grant portfolio: proven vs. promising vs. experimental programs.

Key learning questions to guide the next 12–24 months.

Strategic options (e.g., scale proven models, fund promising pilots, build advocacy capacity) with pros and cons.

Decision routines: when and how to revisit assumptions and evidence.

Examples of small tests or pilot efforts with clear success criteria.

Engagement plan: ways to bring in stakeholders, board members, and community voices.

Roadmap for the next 90 days: milestones, risks, and responsibilities.

Encourage reflection and interaction among team members while grounding the guide in evidence and best practices.

**Constraints**
Do not use numbered lists or bullet points within sections. Present each deliverable as a separate paragraph with clear paragraph breaks.

`,
  },
];
