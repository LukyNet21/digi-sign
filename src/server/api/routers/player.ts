import { tracked } from "@trpc/server";
import { on } from "events";
import { EventEmitter } from "stream";
import z from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { eq } from "drizzle-orm";
import { playlists } from "~/server/db/schema";

type PlayEvent = {
  id: number;
  startTime: number;
};

const ee = new EventEmitter();
let lastPlayEvent: PlayEvent | null = null;

export const playerRouter = createTRPCRouter({
  player: publicProcedure
    .input(z.object({ lastEventId: z.string().nullish() }).optional())
    .subscription(async function* ({ input, signal }) {
      // Replay if reconnecting
      if (input?.lastEventId && lastPlayEvent && Number(input.lastEventId) < lastPlayEvent.id) {
        yield tracked(String(lastPlayEvent.id), lastPlayEvent);
      } else if (lastPlayEvent) {
        yield tracked(String(lastPlayEvent.id), lastPlayEvent);
      }

      // Stream new events
      for await (const [data] of on(ee, 'play', { signal })) {
        const event = data as PlayEvent;
        lastPlayEvent = event;
        yield tracked(String(event.id), event);
      }
    }),
  play: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Validate playlist exists
      const pl = await ctx.db.query.playlists.findFirst({ where: eq(playlists.id, input.id) });
      if (!pl) throw new Error('Playlist not found');

      const event: PlayEvent = {
        id: input.id,
        startTime: Date.now() + 3000,
      };
      lastPlayEvent = event;
      ee.emit('play', event);
      return { success: true };
    })
});
