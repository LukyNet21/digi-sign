import { tracked } from "@trpc/server";
import { on } from "events";
import { EventEmitter } from "stream";
import z from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { eq } from "drizzle-orm";
import { players, playlists } from "~/server/db/schema";
import { randomBytes } from "crypto";

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
    }),
  connect: publicProcedure
    .input(z.object({ identifier: z.string().optional(), name: z.string().optional() }).optional())
    .mutation(async ({ ctx, input }) => {
      const identifier = input?.identifier;
      if (identifier) {
        const existing = await ctx.db.query.players.findFirst({ where: eq(players.identifier, identifier) });
        if (existing) return existing;
      }
      const [created] = await ctx.db.insert(players).values({
        name: input?.name ?? 'undefined',
        identifier: randomBytes(64).toString('hex'),
      }).returning();
      return created;
    }),
  list: publicProcedure
    .query(async ({ ctx }) => {
      const list = await ctx.db.query.players.findMany({ orderBy: (t, { asc }) => [asc(t.name)] });
      return list;
    }),
  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const pl = await ctx.db.query.players.findFirst({ where: eq(players.id, input.id) });
      if (!pl) throw new Error('Player not found');
      return pl;
    }),
  update: publicProcedure
    .input(z.object({ id: z.number(), name: z.string().min(1), description: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const { id, name, description } = input;
      const [updated] = await ctx.db.update(players).set({ name, description }).where(eq(players.id, id)).returning();
      if (!updated) throw new Error('Player not found');
      return updated;
    }),
  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(players).where(eq(players.id, input.id));
      return { success: true };
    }),
});
