"use client";

import { useState, useEffect, ReactNode } from "react";

export const FAQ: React.FC = () => {
  return (
    <div className="mx-auto max-w-3xl p-4">
      <h1 className="mb-6 text-center text-2xl font-bold">
        Complēre — FAQ for Grantmakers
      </h1>

      <Accordion title="1. What is Complēre and why was it built?" id="what-is">
        <p>
          Complēre is a secure AI platform that lets program staff{" "}
          <strong>
            search, organize, and interact with a curated library of 5,000+
            poverty-focused studies, meta-analyses, and benefit-cost metrics
          </strong>
          ; pair those findings with proposals or site-visit materials; and
          generate decision-ready outputs in seconds. It was designed by
          foundation insiders to streamline text-heavy workflows that pull you
          away from grantees and strategic thinking.
        </p>
      </Accordion>

      <Accordion
        title="2. How is it different from a public chatbot like ChatGPT?"
        id="differences"
      >
        <p>
          General chatbots scrape the open web and can hallucinate or cite
          unreliable sources. Complēre's language model is
          <strong> locked to a vetted research corpus by default</strong>, with
          an optional
          <strong> "Web Search ON"</strong> toggle so you stay in control of
          source quality.
        </p>
      </Accordion>

      <Accordion
        title="3. Do I need technical or data-science skills to use it?"
        id="technical-skills"
      >
        <p>
          No. The interface is prompt-based—type plain-language questions (e.g.,
          "Summarize this 20-page proposal and flag red-flags") or upload files
          and choose a workflow. On first login the system asks a few onboarding
          questions about your foundation so outputs arrive in the right voice
          and format.
        </p>
      </Accordion>

      <Accordion
        title="4. Which everyday tasks can Complēre handle—and what's coming next?"
        id="everyday-tasks"
      >
        <FeatureTable />
        <Blockquote>
          <p>
            <strong>These are only the beginning.</strong> We're continuously
            adding new "easy buttons" across the full grantmaking
            workflow—ranging from quick helpers (auto-format board packets) to
            advanced engines (multi-year portfolio impact simulations).{" "}
            <strong>Have an idea?</strong> Email
            <em> support@complere.ai</em> and help shape our roadmap.
          </p>
        </Blockquote>
      </Accordion>

      <Accordion
        title="5. Where does the research come from, and how trustworthy is it?"
        id="research-source"
      >
        <p>
          Studies are{" "}
          <strong>
            curated from organizations that already conduct benefit-cost
            analysis to inform public and philanthropic budgets.
          </strong>
          Each addition passes a quality screen before entering the corpus, and
          citations are returned with every answer.
        </p>
      </Accordion>

      <Accordion
        title="6. Can I still look beyond the vetted database?"
        id="beyond-database"
      >
        <p>
          Yes. Flip the <strong>Web Search ON/OFF</strong> switch at any time.
          Leaving it OFF guarantees the model references only the curated
          library; turning it ON lets the system pull from the wider internet
          and clearly labels those sources so you can validate them.
        </p>
      </Accordion>

      <Accordion
        title="7. Is the data I upload (proposals, board packets, Form 990s) secure?"
        id="data-security"
      >
        <p>
          Complēre runs in a private cloud, encrypts files in transit, and never
          trains the model on your proprietary documents. Only colleagues you
          invite to a <strong>Project or Team Space</strong> can see your
          uploads or AI-generated outputs.
        </p>
      </Accordion>
    </div>
  );
};

type FeatureTableRow = {
  button: string;
  use: string;
  timeSaver: string;
};

type FormattedListProps = {
  items: string[];
};

type BlockquoteProps = {
  children: ReactNode;
};

const features: FeatureTableRow[] = [
  {
    button: "Program Evaluation Assistant",
    use: "Summarize proposals, surface evidence, draft probing questions",
    timeSaver: "Automates first-round review",
  },
  {
    button: "Site-Visit Preparation",
    use: "Upload proposal + materials → auto-generate visit agenda & inquiry list",
    timeSaver: "Arrive with research-backed talking points",
  },
  {
    button: "Strategic Planning Assistant",
    use: "Live co-pilot during planning sessions; builds dashboards from uploads",
    timeSaver: "Cuts prep time for all participants",
  },
  {
    button: "RFP Writer / Award & Rejection Letters",
    use: "Draft or rewrite docs to your tone & guidelines",
    timeSaver: "Maintains consistency & saves hours",
  },
  {
    button: "Bias Checker & Counterpoint Creator",
    use: "Flag assumptions; offer alternative framings",
    timeSaver: "Promotes equity and better decisions",
  },
];

// Create a Table component to handle the table in FAQ item #4
const FeatureTable = () => {
  return (
    <div className="my-3 overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 p-2 text-left font-medium">
              Current "Easy Button" (example)
            </th>
            <th className="border border-gray-300 p-2 text-left font-medium">
              Typical Use
            </th>
            <th className="border border-gray-300 p-2 text-left font-medium">
              Key Time-Saver
            </th>
          </tr>
        </thead>
        <tbody>
          {features.map((feature, index) => (
            <tr key={index}>
              <td className="border border-gray-300 p-2">
                <strong>{feature.button}</strong>
              </td>
              <td className="border border-gray-300 p-2">{feature.use}</td>
              <td className="border border-gray-300 p-2">
                {feature.timeSaver}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Create a custom component for formatted list items
const FormattedList = ({ items }: FormattedListProps) => {
  return (
    <ul className="my-3 list-disc space-y-1 pl-6">
      {items.map((item, index) => (
        <li key={index} dangerouslySetInnerHTML={{ __html: item }} />
      ))}
    </ul>
  );
};

// Create a component for the note/blockquote in FAQ item #4
const Blockquote = ({ children }: BlockquoteProps) => {
  return (
    <blockquote className="my-4 border-l-4 border-gray-300 pl-4 italic text-gray-600">
      {children}
    </blockquote>
  );
};

type AccordionProps = {
  children: ReactNode;
  title: string;
  id: string;
  active?: boolean;
};

const Accordion = ({ children, title, id, active = false }: AccordionProps) => {
  const [accordionOpen, setAccordionOpen] = useState<boolean>(false);

  useEffect(() => {
    setAccordionOpen(active);
  }, [active]);

  return (
    <div className="mb-2 rounded border border-gray-200 bg-white">
      <h2>
        <button
          className="font-inter-tight flex w-full items-center justify-between px-4 py-2.5 text-left font-medium text-zinc-800"
          onClick={(e) => {
            e.preventDefault();
            setAccordionOpen(!accordionOpen);
          }}
          aria-expanded={accordionOpen}
          aria-controls={`accordion-text-${id}`}
        >
          <span>{title}</span>
          <svg
            className="ml-8 shrink-0 fill-zinc-400"
            width="12"
            height="12"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              y="5"
              width="12"
              height="2"
              rx="1"
              className={`origin-center transform transition duration-200 ease-out ${accordionOpen && "!rotate-180"}`}
            />
            <rect
              y="5"
              width="12"
              height="2"
              rx="1"
              className={`origin-center rotate-90 transform transition duration-200 ease-out ${accordionOpen && "!rotate-180"}`}
            />
          </svg>
        </button>
      </h2>
      <div
        id={`accordion-text-${id}`}
        role="region"
        aria-labelledby={`accordion-title-${id}`}
        className={`grid overflow-hidden text-sm text-zinc-500 transition-all duration-300 ease-in-out ${accordionOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-3">{children}</div>
        </div>
      </div>
    </div>
  );
};
