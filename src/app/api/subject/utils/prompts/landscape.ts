import { CONTINUE_ANALYSIS_PROMPT } from "./analysis";
import { getExampleCitations, OUTPUT_FORMAT_NOTICE } from "./output-format";

// Maps ecosystem of comparable programs and organizations to identify gaps, overlaps, and positioning opportunities
export const START_LANDSCAPE_PROMPT = `
## Landscape Analysis

Create a **Landscape Analysis** for **{{Issue_Area}}** in **{{Region}}** as it relates to **{{Org_Name}}**'s proposed work.

---

### **Purpose**
To understand the ecosystem of organizations, programs, and intermediaries operating within the defined issue area and region—identifying comparables, gaps, opportunities, and positioning options for **{{Org_Name}}**.

---

### **Output Structure**

**Executive Summary**  
Provide a brief overview of the landscape, including:
- The service/problem domain and target population
- What is in and out of scope for this analysis (e.g., state vs. national intermediaries)
- Key themes and patterns observed across the ecosystem

**Major Organizations**  
Profile **3 leading or well-established intermediaries or program providers** with measurable statewide or national impact. For each organization, provide a structured profile that covers:
- **Organization name and mission**
- **Intervention type and approach**
- **Scale, reach, and geographic coverage**
- **Target population served**
- **Outcomes and impact** (if available)
- **Funding mix and sustainability model**
- **Key collaborations and partnerships**
- **What makes them significant in the landscape**

**REQUIRED FORMAT:** Each profile must follow this exact structure:
1. **Organization name as a subheading** (e.g., ### Organization Name)
2. **Brief introductory sentence** about the organization
3. **Bolded labels on separate lines** - Each element above must use the format "**Label:**" followed by description on the same line, then start a new line for the next label (e.g., "**Mission:**" followed by description, then "**Scale:**" on a new line with its description, etc.)
4. **Concluding sentence** about the organization's significance in the landscape
5. **Include cited sources** with links

**CRITICAL:** Do NOT write in flowing paragraph format. Each bolded label must be on its own separate line.

⚙️ *Note: When focusing on state-level intermediaries, exclude national organizations unless they have a significant state footprint.*

**Emerging or Lesser-Known Organizations**  
Profile **3 innovative or locally focused efforts** that show potential or unique models. For each organization, use the same structured format as above, emphasizing:
- What makes them innovative or promising
- How they differ from established players
- Their growth trajectory or potential

**REQUIRED FORMAT:** Follow the exact same structure as Major Organizations:
1. **Organization name as a subheading** (e.g., ### Organization Name)
2. **Brief introductory sentence** about the organization
3. **Bolded labels on separate lines** using the same elements as above
4. **Concluding sentence** about significance
5. **Include cited sources** with links

**CRITICAL:** Do NOT write in flowing paragraph format. Each bolded label must be on its own separate line.

**Additional Organizations**  
List **10 additional relevant actors** with one-sentence descriptions that capture their core focus and relevance to the landscape.

**Position in the Landscape**  
Provide a 3-sentence introduction that describes how **{{Org_Name}}** fits within this ecosystem, including its potential role and strategic positioning. Follow with 3-5 bullet points that address **{{Org_Name}}**'s relevance in relation to the organizations mapped above:
- How **{{Org_Name}}**'s approach compares or contrasts with major players
- Unique value or positioning relative to emerging organizations
- Areas of potential overlap or complementarity
- Differentiation opportunities in the current landscape
- Strategic advantages or gaps that could be leveraged

**Gap & Opportunity Analysis**  
Assess:
- Geographic or service gaps in the current landscape
- Areas of duplication and complementarity
- Equity and access considerations
- Notable absences (e.g., if a relevant state lacks an equivalent intermediary)
- Best-practice models and evidence base, tied to local context and **{{Org_Name}}**'s objectives
- State-specific innovations or differences from national trends

**Reflective Questions**  
Provide 4-6 questions to guide strategic thinking about **{{Org_Name}}**'s role, such as:
- What unmet needs or gaps could **{{Org_Name}}** address?
- Which organizations represent the strongest partnership opportunities?
- How might **{{Org_Name}}** differentiate itself in this landscape?
- What lessons from established or emerging organizations could inform **{{Org_Name}}**'s approach?
- Are there ecosystem dynamics or trends that **{{Org_Name}}** should consider?

**Citations**  
List all sources cited throughout the analysis with full links.

**Follow-On Prompt**  
"Would you like to extend this analysis beyond **{{Region}}** (e.g., state, multi-state, or national) to identify additional comparables and innovations?"

---

### **Standards**
- Use reputable data sources (state and national reports, organization websites, credible intermediaries)
- **Cite sources and provide links** for each organization listed
- Note uncertainties and data gaps
- Adjust the number of organizations (e.g., 3/3/10) for broader analyses such as national landscapes
- Follow the structured format with bolded labels on separate lines (as specified in the REQUIRED FORMAT sections)
- Maintain a professional, analytical tone throughout

---

### **Optional User Input**
Provide users with an initial **Landscape Analysis Landing Page** that includes:
- Upload option for files or data sources  
- Text box: "Any additional context?"  
  *(e.g., focus only on state-level intermediaries, exclude national organizations, include recent reports, etc.)*

This helps shape the initial landscape analysis and reduces the need for follow-up prompts.

---
${getExampleCitations(5)}

## Constraints

1. **Variable Handling**: If the organization name variable is not provided or contains placeholder text (e.g., empty string, null, or literal "{{Org_Name}}"), adapt the content accordingly:
   - In the "Position in the Landscape" section, use generic language like "a new organization" or "the proposed organization" instead of the placeholder
   - In reflective questions, rephrase to be about "your organization" or "the organization" rather than using the placeholder
   - Maintain all sections but ensure no literal placeholder text appears in the final output

2. Reply with your response in markdown format. No need to reply with "of course!" or any conversational language in your reply here.

3. ${OUTPUT_FORMAT_NOTICE}

4. **Important**: After presenting all **Citations** with full links, end your response with the **Follow-On Prompt**: "Would you like to extend this analysis beyond **{{Region}}** (e.g., state, multi-state, or national) to identify additional comparables and innovations?"
`;

export const CONTINUE_LANDSCAPE_PROMPT = `${CONTINUE_ANALYSIS_PROMPT}.

Your goal in this chat is to provide landscape analysis to the given documents.

${OUTPUT_FORMAT_NOTICE}`;