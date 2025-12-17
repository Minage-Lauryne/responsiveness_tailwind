import { createTRPCRouter, publicProcedure } from "../trpc";

interface Event {
  api_id: string;
  event: {
    api_id: string;
    cover_url: string;
    name: string;
    description: string;
    description_md: string;
    start_at: string;
    end_at: string;
    url: string;
    timezone: string;
    meeting_url: string;
  };
}

interface EventsResponse {
  entries: Event[];
}

export const eventsRouter = createTRPCRouter({
  list: publicProcedure.query(async ({ ctx }) => {
    try {
      const response = await fetch(
        `https://public-api.lu.ma/public/v1/calendar/list-events?after=${new Date().toISOString()}`,
        {
          headers: {
            "X-Luma-Api-Key": process.env.LUMA_API_KEY as string,
          },
          next: { revalidate: 60 }, // Cache for 60 seconds
        },
      );
      if (!response.ok) {
        return {
          error: "Failed to fetch events",
          entries: [],
        };
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const events = await response.json();

      return events as EventsResponse;
    } catch (error) {
      console.error(error);
      return {
        error: "Broader failure in fetching events",
        entries: [],
      };
    }
  }),
});
