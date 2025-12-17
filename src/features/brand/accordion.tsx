"use client";

import { useState, useEffect } from "react";

type AccordionpProps = {
  children: React.ReactNode;
  title: string;
  id: string;
  active?: boolean;
};

export default function Accordion({
  children,
  title,
  id,
  active = false,
}: AccordionpProps) {
  const [accordionOpen, setAccordionOpen] = useState<boolean>(false);

  useEffect(() => {
    setAccordionOpen(active);
  }, []);

  return (
    <div className="rounded bg-white">
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
          <p className="px-4 pb-3">{children}</p>
        </div>
      </div>
    </div>
  );
}
