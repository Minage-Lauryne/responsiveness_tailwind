"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Heading, Subheading } from "./text";

export function UpcomingWorkshops({ className }: { className?: string }) {
  const { data: events } = api.events.list.useQuery();
  const [displayCount, setDisplayCount] = useState(2);

  if (!events?.entries?.length) {
    return (
      <div className={cn("mx-auto max-w-6xl py-16", className)}>
        <div className="mb-12">
          <div className="mb-2 h-6 w-20 animate-pulse rounded bg-muted" />
          <div className="mb-4 h-8 w-64 animate-pulse rounded bg-muted" />
          <div className="h-6 w-96 animate-pulse rounded bg-muted" />
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-lg bg-white shadow"
            >
              <div className="p-6">
                <div className="mb-4">
                  <div className="mb-2 h-4 w-48 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-32 animate-pulse rounded bg-muted" />
                </div>
                <div className="mb-4 h-6 w-full animate-pulse rounded bg-muted" />
                <div className="mb-2 h-4 w-full animate-pulse rounded bg-muted" />
                <div className="mb-4 h-4 w-3/4 animate-pulse rounded bg-muted" />
                <div className="flex items-center justify-between">
                  <div />
                  <div className="h-9 w-24 animate-pulse rounded-full bg-muted" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const visibleEvents = events.entries.slice(0, displayCount);
  const hasMoreEvents = events.entries.length > displayCount;

  const loadMore = () => {
    setDisplayCount((prev) => prev + 5);
  };

  return (
    <div className={cn("mx-auto max-w-6xl py-16", className)}>
      <div className="mb-12" id="upcoming-workshops">
        <Subheading>Join Us</Subheading>
        <Heading>Join the next beta onboarding session... </Heading>

        <div className="mt-4 max-w-2xl text-lg ">
          Learn directly from our experts in these interactive sessions designed
          for foundation professionals.
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {visibleEvents.map((event) => {
          // Safe type check for optional image_url
          // const imageUrl = event.event.cover_url ?? DEFAULT_IMAGE;

          const eventDate = new Date(event.event.start_at);

          return (
            <div
              key={event.api_id}
              className="overflow-hidden rounded-lg bg-white shadow"
            >
              {/* <div className="h-48 w-full overflow-hidden">
                <Image
                  src={imageUrl}
                  alt={event.event.name}
                  className="h-full w-full object-cover"
                  width={300}
                  height={300}
                />
              </div> */}
              <div className="p-6">
                <div className="mb-4 text-sm font-semibold  tracking-wide">
                  <div>
                    {eventDate.toLocaleTimeString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </div>
                  <span className="text-xs text-gray-500">
                    ({formatDistanceToNow(eventDate, { addSuffix: true })})
                  </span>
                </div>
                <Link
                  href={event.event.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mb-4 text-2xl font-bold"
                >
                  {event.event.name}
                </Link>
                {event.event.description && (
                  <div className="mb-4 text-sm">
                    {event.event.description
                      .split(".")[0]
                      ?.substring(
                        0,
                        Math.min(
                          event.event.description.split(".")[0]?.length || 0,
                          60,
                        ),
                      )}
                    {(event.event.description?.length || 0) > 60 && "..."}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="text-sm"></div>
                  <Link
                    href={event.event.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      effect="expandIcon"
                      variant="default"
                      className="rounded-full"
                      icon={ArrowRight}
                      iconPlacement="right"
                    >
                      Register
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {hasMoreEvents && (
        <div className="mt-8 flex justify-center">
          <Button onClick={loadMore} variant="outline">
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}
