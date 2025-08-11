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

const activePlayers = new Map<number, PlayEvent>();
const ee = new EventEmitter();

export const playerRouter = createTRPCRouter({
  player: publicProcedure
    .input(z.object({ lastEventId: z.string().nullish(), identifier: z.string() }))
    .subscription(async function* ({ input, signal, ctx }) {
      const p = await ctx.db.query.players.findFirst({ where: eq(players.identifier, input.identifier) });
      if (!p) throw new Error('Player not found');

      // Replay if reconnecting
      const lastEvent = activePlayers.get(p.id)
      if (lastEvent) {
        yield tracked(String(lastEvent.id), lastEvent);
      }

      // Stream new events
      for await (const [data] of on(ee, String(p.id), { signal })) {
        const event = data as PlayEvent;
        yield tracked(String(event.id), event);
      }
    }),
  play: publicProcedure
    .input(z.object({ playlistId: z.number(), playerId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Validate playlist exists
      const pl = await ctx.db.query.playlists.findFirst({ where: eq(playlists.id, input.playlistId) });
      if (!pl) throw new Error('Playlist not found');
      const player = await ctx.db.query.players.findFirst({ where: eq(players.id, input.playerId) });
      if (!player) throw new Error('Player not found');

      const event: PlayEvent = {
        id: input.playlistId,
        startTime: Date.now() + 3000,
      };

      activePlayers.set(player.id, event);

      ee.emit(String(player.id), event);

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
