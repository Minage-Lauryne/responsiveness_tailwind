import Link from "next/link";
import { Heading, Subheading } from "./headers";

const faqs = [
  {
    question: "How long does it take to build a SaaS platform?",
    answer:
      "Most projects take 4-6 months from concept to launch. You’ll have a working login within the first month. The goal isn’t just launching—it’s getting happy, paying customers as fast as possible.",
  },
  {
    question: "Do I need technical expertise to manage the platform?",
    answer:
      "No. We build intuitive admin tools that allow non-technical users to manage the platform.",
  },
  {
    question: "How do we transition existing clients to the new platform?",
    answer:
      "We use a phased rollout strategy, starting with a small group of ideal clients. We help create onboarding materials, provide hands-on technical support, and refine the experience based on real user feedback before full deployment.",
  },
  {
    question: "Can the platform integrate with our existing tools?",
    answer:
      "Yes. We regularly build custom integrations with other systems (and with AI, this is smoother than ever). That said, we only consider integrations that directly improve our new product for your customers—not making internal ERP replacements.",
  },
  {
    question: "How do we monetize the platform?",
    answer: (
      <>
        From the beginning, we consider the business model. We use the
        industry-standard payment provider & toolkit,{" "}
        <Link
          href="https://stripe.com"
          className="text-blue-600 hover:text-blue-800 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Stripe
        </Link>
        . Options include subscription tiers, usage-based pricing,
        implementation fees, or hybrid models with manual billing.
      </>
    ),
  },
  {
    question: "What happens after the platform launches?",
    answer:
      'Software is never truly "done." We improve based on user feedback and business needs. If budget is tight, we switch from build mode to maintenance mode until you’re ready for the next iteration.',
  },
];

// const faqs = [
//   {
//     question: 'How long does it take to build a SaaS platform?',
//     answer:
//       'At least 4-6 months from concept to launch. You will have a login within the first month. Happy, paying customers are the guideposts.',
//   },
//   {
//     question: 'Do I need technical expertise to manage the platform?',
//     answer:
//       'No. I design intuitive admin interfaces that allow non-technical users to manage the platform.',
//   },
//   {
//     question: 'How do we transition clients to the new platform?',
//     answer:
//       'I develop a phased rollout strategy, typically starting with a small group of ideal clients. I help create onboarding materials, provide technical support during the transition, and gather feedback to refine the experience before full deployment.',
//   },
//   {
//     question: 'Can the platform integrate with our existing tools?',
//     answer:
//       'Yes. We write custom connections to other systems all the time (with AI, this is smoother than ever). However, the point is not to build you an operations/ERP platform. We only do so when it means directly improving the product for your clients.',
//   },
//   {
//     question: 'How do we monetize the platform?',
//     answer: (
//       <>
//         From the beginning, we consider the business model. We use the
//         industry-standard payment provider & toolkit,{' '}
//         <Link
//           href="https://stripe.com"
//           className="text-blue-600 hover:text-blue-800 hover:underline"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Stripe
//         </Link>
//         . Options include subscription tiers, usage-based pricing,
//         implementation fees, or hybrid models with manual billing.
//       </>
//     ),
//   },
//   {
//     question: 'What happens after the platform launches?',
//     answer:
//       "Software is never truly 'finished.' We make improvements based on user feedback and evolving business needs. If budget is the concern, then we switch off build mode and enter maintenance mode until you're ready for changes.",
//   },
// ]

export function FAQSection() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="my-20 space-y-6">
          <Subheading>Frequently asked questions</Subheading>
          <Heading>Common Questions</Heading>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 gap-x-12 gap-y-16 md:grid-cols-2">
          {faqs.map((faq, i) => (
            <div key={i} className="space-y-2">
              <h4 className="text-xl font-bold text-gray-900">
                {faq.question}
              </h4>
              <p className="text-gray-600">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
