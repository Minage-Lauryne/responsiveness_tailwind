import { Heading, Subheading } from "./text";

export type Challenge = {
  title: string;
  description: string;
};

const challenges: Challenge[] = [
  {
    title: "No tool can replicate the value of lived experience.",
    description:
      "You've built knowledge through years of listening, learning, and leading. Complēre doesn't compete with that. It complements it, giving you relevant information to apply with your own insight and relationships.",
  },
  {
    title: "Philanthropy is built on trust, not transactions.",
    description:
      "That's why Complēre is built to protect sensitive data and respect the human side of funding. It helps you act with speed without compromising the care that drives lasting outcomes.",
  },
  {
    title: "It's not about more data. It's about direction.",
    description:
      "Complēre helps cut through the noise to deliver credible, relevant insight you can actually use so your next decision is faster, better informed, and more likely to lead to the results you've spent your career working toward.",
  },
];

export function Problem() {
  return (
    <section className="container bg-white p-2 py-24 sm:py-2">
      <div className="">
        <div className="my-4 space-y-6">
          <Subheading>The Problem</Subheading>
          <Heading>
            AI tools don't feel like they were built for the work I do.
          </Heading>
          <div className="text-gray-600">
            They're fast, but I'm not sure they're aligned with how philanthropy
            actually works.
          </div>
        </div>
        <div className="grid grid-cols-1 gap-12 sm:gap-0 md:grid-cols-3">
          {challenges.map((challenge, index) => (
            <ChallengeBox
              key={index}
              title={challenge.title}
              description={challenge.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ChallengeBox({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="group relative space-y-0 rounded-lg border border-gray-200/15 bg-white p-8 shadow-sm">
      <div className="mb-2 flex items-center gap-3">
        {/* <div className="bg-red-50 p-2 opacity-40">
          <svg
            className="h-5 w-5 text-red-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              d="M6 18L18 6M6 6l12 12"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div> */}
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
      </div>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
