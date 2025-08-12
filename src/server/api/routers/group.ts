import { eq, inArray } from "drizzle-orm";
import z from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { playerGroupMembers, playerGroups, players } from "~/server/db/schema";

export const groupRouter = createTRPCRouter({
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.query.playerGroups.findMany({ orderBy: (t, { asc }) => [asc(t.name)] });
  }),
  get: publicProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    const group = await ctx.db.query.playerGroups.findFirst({ where: eq(playerGroups.id, input.id) });
    if (!group) throw new Error('Group not found');
    const members = await ctx.db.query.playerGroupMembers.findMany({ where: eq(playerGroupMembers.groupId, input.id) });
    const memberIds = members.map(m => m.playerId);
    const memberPlayers = memberIds.length
      ? await ctx.db.select().from(players).where(inArray(players.id, memberIds))
      : [];
    return { ...group, members: memberPlayers };
  }),
  create: publicProcedure.input(z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    memberIds: z.array(z.number()).default([]),
  })).mutation(async ({ ctx, input }) => {
    const [g] = await ctx.db.insert(playerGroups).values({ name: input.name, description: input.description }).returning();
    if (!g) throw new Error('Failed to create group');
    if (input.memberIds.length) {
      await ctx.db.insert(playerGroupMembers).values(input.memberIds.map(pid => ({ groupId: g.id, playerId: pid })));
    }
    return g;
  }),
  update: publicProcedure.input(z.object({
    id: z.number(),
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    memberIds: z.array(z.number()).optional(),
  })).mutation(async ({ ctx, input }) => {
    const { id, memberIds, ...data } = input;
    const [g] = await ctx.db.update(playerGroups).set({ ...data }).where(eq(playerGroups.id, id)).returning();
    if (!g) throw new Error('Group not found');
    if (memberIds) {
      // replace members
      await ctx.db.delete(playerGroupMembers).where(eq(playerGroupMembers.groupId, id));
      if (memberIds.length) {
        await ctx.db.insert(playerGroupMembers).values(memberIds.map(pid => ({ groupId: id, playerId: pid })));
      }
    }
    return g;
  }),
  delete: publicProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    await ctx.db.delete(playerGroups).where(eq(playerGroups.id, input.id));
    return { success: true };
  }),
});
