"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import { useState } from "react";

export function ExplainCard() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const cards = [
    {
      id: 1,
      title: "Start by uploading a document",
      content:
        "Your documents will be stored in your workspace for all our next steps",
      bgColor: "bg-slate-200",
    },
    {
      id: 2,
      title: "Review the initial analysis",
      content:
        "We'll provide a summary of how research aligns with a program's goals.",
      bgColor: "bg-slate-200",
    },
    {
      id: 3,
      title: "Select follow up workflows",
      content:
        "Choose from a variety of follow up workflows to get more insights such as BCR's, compare & contrast analysis, or finding related research",
      bgColor: "bg-slate-200",
    },
  ];

  const nextCard = () => {
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  const CARD_WIDTH = 850;
  const CARD_GAP = 32;
  const CONTAINER_WIDTH = CARD_WIDTH + 200; // Shows one full card + part of next

  return (
    <div className="flex w-full flex-col justify-center">
      {/* Carousel Container */}
      <div
        className="relative w-full overflow-hidden"
        style={{ maxWidth: `${CONTAINER_WIDTH}px` }}
      >
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{
            transform: `translateX(-${currentIndex * (CARD_WIDTH + CARD_GAP)}px)`,
            gap: `${CARD_GAP}px`,
          }}
        >
          {cards.map((card) => (
            <div
              key={card.id}
              className="flex-shrink-0 "
              style={{ width: `${CARD_WIDTH}px`, height: "720px" }}
            >
              <Card className="h-full border-0 bg-slate-900 shadow-lg">
                <CardContent className="flex h-full flex-col p-12">
                  <div
                    className={`w-full rounded-xl ${card.bgColor} mb-8`}
                    style={{ aspectRatio: "16/9", height: "420px" }}
                  />
                  <h3 className="mb-2  text-lg text-white">{card.title}</h3>
                  <div className="flex-1">
                    <div className="leading-relaxed text-white">
                      {card.content}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Dots and Next Button */}
      <div className="mt-12 flex justify-center gap-6">
        <div className="flex items-center gap-3">
          {cards.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-3 w-3 rounded-full transition-all ${
                index === currentIndex ? "w-8 bg-white" : "bg-white/40"
              }`}
            />
          ))}
        </div>
        <Button
          size="lg"
          onClick={nextCard}
          className="ml-4"
          effect="expandIcon"
          iconPlacement="right"
          icon={ChevronRight}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
