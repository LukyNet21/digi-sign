import path from "path";
import z from "zod";
import fs from 'fs/promises';
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { files } from "~/server/db/schema";
import { v4 as uuidv4 } from 'uuid';
import { eq } from "drizzle-orm";
import { unlink } from "fs";

const ALLOWED_MIME_TYPES = [
  'video/mp4',
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

export const mediaRouter = createTRPCRouter({
  uploadFile: publicProcedure
    .input(z.object({
      name: z.string(),
      filename: z.string(),
      type: z.string(),
      content: z.instanceof(Uint8Array),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ALLOWED_MIME_TYPES.includes(input.type)) {
        throw new Error('Unsupported file type');
      }

      const ext = path.extname(input.filename);
      const id = uuidv4();
      const uniqueFilename = `${id}${ext}`;
      const uploadDir = path.join(process.cwd(), 'media/uploads');
      await fs.mkdir(uploadDir, { recursive: true });

      const filePath = path.join(uploadDir, uniqueFilename);
      await fs.writeFile(filePath, Buffer.from(input.content));

      const insertedFile = await ctx.db.insert(files).values({
        name: input.name,
        fileName: input.filename,
        path: uniqueFilename,
        mimeType: input.type,
        size: input.content.length,
      }).returning()

      if (!insertedFile[0]) {
        throw new Error('File upload failed, please try again.');
      }

      return { success: true, url: `/file/${insertedFile[0].id}` };
    }),
  getFiles: publicProcedure
    .query(async ({ ctx }) => {
      const posts = await ctx.db.query.files.findMany()

      return posts 
    }),
  getFile: publicProcedure
    .input(z.object({
      id: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const file = await ctx.db.query.files.findFirst({
        where: eq(files.id, input.id),
      });

      if (!file) {
        throw new Error('File not found');
      }

      return file;
    }),
  deleteFile: publicProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const file = await ctx.db.query.files.findFirst({
        where: eq(files.id, input.id),
      });

      if (!file) {
        throw new Error('File not found');
      }
      const filePath = path.join(process.cwd(), 'media/uploads', file.path);

      try {
        unlink(filePath, (err) => {
          if (err) throw err;
        });
      } catch (error) {
        const err = error as NodeJS.ErrnoException
        if (err.code !== 'ENOENT') {
          throw new Error('Failed to delete file from disk');
        }
      }

      await ctx.db.delete(files).where(eq(files.id, input.id));

      return { success: true };

    })
});
