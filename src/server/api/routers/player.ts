import { on } from "events";
import { EventEmitter } from "stream";
import z from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

const ee = new EventEmitter();
let lastPlayerId: number | null = null;

export const playerRouter = createTRPCRouter({
  player: publicProcedure.subscription(async function*(opts) {
    if (lastPlayerId) {
      yield lastPlayerId;
    }

    // listen for new events
    for await (const [data] of on(ee, 'play', {
      // Passing the AbortSignal from the request automatically cancels the event emitter when the request is aborted
      signal: opts.signal,
    })) {
      const id = data as number;
      console.log(id)
      yield id;
    }
  }),
  play: publicProcedure.
    input(z.object({
      id: z.number()
    })).mutation(({ input }) => {
      lastPlayerId = input.id;
      ee.emit('play', input.id)
    })
});
