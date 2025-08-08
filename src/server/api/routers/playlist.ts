import { eq, inArray } from "drizzle-orm";
import z from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { playlistItems, playlists, files } from "~/server/db/schema";

const playlistItemConfigSchema = z.object({
  fileId: z.number(),
  position: z.number().int().nonnegative(),
  imageDisplayDurationMs: z.number().int().positive().optional(),
  pdfPageDurationMs: z.number().int().positive().optional(),
  pdfDocumentLoopCount: z.number().int().optional(),
  videoLoopCount: z.number().int().optional(),
});

export const playlistRouter = createTRPCRouter({
  list: publicProcedure.query(({ ctx }) => {
    return ctx.db.query.playlists.findMany({
      orderBy: (t, { asc }) => [asc(t.name)],
    });
  }),
  get: publicProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    const playlist = await ctx.db.query.playlists.findFirst({ where: eq(playlists.id, input.id) });
    if (!playlist) throw new Error('Playlist not found');

    const items = await ctx.db.query.playlistItems.findMany({
      where: eq(playlistItems.playlistId, playlist.id),
      orderBy: (t, { asc }) => [asc(t.position)],
    });

    const fileIds = [...new Set(items.map(i => i.fileId))];
    let relatedFiles: typeof files.$inferSelect[] = [];
    if (fileIds.length) {
      relatedFiles = await ctx.db.select().from(files).where(inArray(files.id, fileIds));
    }
    const fileMap = new Map(relatedFiles.map(f => [f.id, f]));
    return { ...playlist, items: items.map(i => ({ ...i, file: fileMap.get(i.fileId) })) };
  }),
  create: publicProcedure.input(z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    items: z.array(playlistItemConfigSchema).default([]),
  })).mutation(async ({ ctx, input }) => {
    const [pl] = await ctx.db.insert(playlists).values({ name: input.name, description: input.description }).returning();
    if (!pl) throw new Error('Failed to create playlist');

    if (input.items.length) {
      await ctx.db.insert(playlistItems).values(input.items.map(i => ({ ...i, playlistId: pl.id })));
    }

    return pl;
  }),
  update: publicProcedure.input(z.object({
    id: z.number(),
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    items: z.array(playlistItemConfigSchema).optional(),
  })).mutation(async ({ ctx, input }) => {
    const { id, items, ...data } = input;
    const [pl] = await ctx.db.update(playlists).set({ ...data }).where(eq(playlists.id, id)).returning();
    if (!pl) throw new Error('Playlist not found');

    if (items) {
      await ctx.db.delete(playlistItems).where(eq(playlistItems.playlistId, id));
      if (items.length) {
        await ctx.db.insert(playlistItems).values(items.map(i => ({ ...i, playlistId: id })));
      }
    }

    return pl;
  }),
  delete: publicProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    await ctx.db.delete(playlists).where(eq(playlists.id, input.id));
    return { success: true };
  }),
});
