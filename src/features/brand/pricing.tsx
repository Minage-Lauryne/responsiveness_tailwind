import { Check } from "lucide-react";
import Link from "next/link";
import { Heading, Subheading } from "./headers";
import { Button } from "@/components/ui/button";

const CALL_URL = "https://placeholder.com";

const pricingPlans = [
  {
    name: "Advisory",
    price: "$800",
    features: [
      "Product roadmap development",
      "Kevin advises on your SaaS strategy",
      "Async email communication & monthy meet",
      "Review competition and existing off the shelf solutions",
      "Outsourcing planing & recommendations",
      "Architecture planning & starter platform handoff",
    ],
    color: "bg-gray-100",
    isMonthly: true,
  },
  {
    name: "Build",
    price: "12k",
    features: [
      "We build, launch, and maintain your SaaS platform",
      "Kevin as fractional CTO",
      "Partial peer-network full-stack engineer",
      "Bi-weekly planning & reviews",
      "You own the code, IP, data, company, and customers",
    ],
    color: "bg-gray-100",
    isMonthly: true,
  },
  // {
  //   name: 'POC',
  //   price: '5k',
  //   description: 'We test out an idea to see if it's worth persuing',
  //   features: [
  //     '2-3 week timeline',
  //     'Technical feasibility testing',
  //     'Architecture validation',
  //     'Rapid prototyping',
  //     'Not production-ready',
  //     'Perfect for initial validation',
  //   ],
  //   color: 'bg-gray-100',
  //   isMonthly: false,
  // },
];

export function PricingSection() {
  return (
    <section id="pricing" className="bg-gray-50 py-24 text-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="my-20 space-y-6">
          <Subheading>How things are priced</Subheading>
          <Heading>Our pricing</Heading>
        </div>

        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 gap-8 bg-white md:grid-cols-2">
            {pricingPlans.map((plan, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-xl border-2 border-gray-200 transition-all hover:border-gray-300 hover:shadow-lg"
              >
                <div className={`flex h-full flex-col`}>
                  <div className={`p-8 ${plan.color}`}>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {plan.name}
                    </h3>
                    <div className="mt-4">
                      <div className="flex items-baseline">
                        <span className="text-7xl font-extrabold text-gray-900">
                          {plan.price}
                        </span>
                        <span className="ml-1 text-lg text-gray-600">
                          {plan.name === "Advisory" || plan.name === "Build"
                            ? "/month"
                            : "one-time payment"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col bg-white p-8">
                    <ul className="space-y-4">
                      {plan.features.map((feature, j) => (
                        <li key={j} className="flex items-start">
                          <div className="flex-shrink-0">
                            <Check className="h-5 w-5 text-gray-800" />
                          </div>
                          <p className="ml-3 text-gray-600">{feature}</p>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-auto pt-8 text-center">
                      <Link href={CALL_URL} className="block w-full">
                        <Button className="w-full">Book a call</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-4 max-w-3xl text-center text-sm text-gray-500">
          * Each month we consider scaling up or down. Cancel anytime. Scaling
          up means adding an engineer & fractional product manager to 25k a
          month. Down means going into maintenance mode at 800 a month or
          cancelling entirely.
        </div>
      </div>
    </section>
  );
}
