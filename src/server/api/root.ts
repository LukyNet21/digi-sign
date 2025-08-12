import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { mediaRouter } from "./routers/media";
import { playerRouter } from "./routers/player";
import { playlistRouter } from "./routers/playlist";
import { groupRouter } from "./routers/group";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  media: mediaRouter,
  player: playerRouter,
  playlist: playlistRouter,
  group: groupRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
