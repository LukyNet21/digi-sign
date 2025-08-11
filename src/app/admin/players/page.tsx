"use client";

import Link from 'next/link';
import { api } from '~/trpc/react';
import { Button } from '~/components/ui/button';
import { Pencil, Trash, Play } from 'lucide-react';
import { useState } from 'react';

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog"

export default function PlayersPage() {
  const players = api.player.list.useQuery();
  const playlists = api.playlist.list.useQuery();
  const utils = api.useUtils();
  const del = api.player.delete.useMutation({
    onSuccess: async () => { await utils.player.list.invalidate(); },
  });
  const play = api.player.play.useMutation();

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Players</h1>
      </div>
      <ul className="space-y-2">
        {players.data?.map((p) => (
          <li key={p.id} className="border rounded p-3 flex justify-between items-center">
            <div>
              <div className="font-medium">{p.name}</div>
              {p.description && <div className="text-sm text-gray-500">{p.description}</div>}
              <div className="text-xs text-gray-400 break-all">{p.identifier}</div>
            </div>
            <div className="flex gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="icon">
                    <Play className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Select Playlist</DialogTitle>
                    <DialogDescription>
                      Select playlist to play on {p.name}
                    </DialogDescription>
                  </DialogHeader>
                  <ul className="space-y-2 mb-4">
                    {playlists.data?.map(pl => (
                      <li key={pl.id}>
                        <Button
                          className="w-full justify-start hover:bg-gray-200"
                          variant="secondary"
                          onClick={() => {
                            play.mutate({ playlistId: pl.id, playerId: p.id });
                          }}
                          disabled={play.isPending}
                        >
                          {pl.name}
                        </Button>
                      </li>
                    ))}
                  </ul>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="secondary">
                        Close
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button variant="secondary" size="icon" asChild>
                <Link href={`/admin/players/${p.id}`}>
                  <Pencil className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="destructive" size="icon" onClick={() => del.mutate({ id: p.id })} disabled={del.isPending}>
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
