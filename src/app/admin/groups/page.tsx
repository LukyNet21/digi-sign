"use client";

import Link from 'next/link';
import { api } from '~/trpc/react';
import { Button } from '~/components/ui/button';
import { Pencil, Trash, Play } from 'lucide-react';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '~/components/ui/dialog';

export default function GroupsPage() {
  const groups = api.group.list.useQuery();
  const utils = api.useUtils();
  const del = api.group.delete.useMutation({ onSuccess: async () => { await utils.group.list.invalidate(); } });
  const playGroup = api.player.playGroup.useMutation();

  const playlists = api.playlist.list.useQuery();

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Groups</h1>
        <Button asChild>
          <Link href="/admin/groups/new">New Group</Link>
        </Button>
      </div>
      <ul className="space-y-2">
        {groups.data?.map((g) => (
          <li key={g.id} className="border rounded p-3 flex justify-between items-center">
            <div>
              <div className="font-medium">{g.name}</div>
              {g.description && <div className="text-sm text-gray-500">{g.description}</div>}
            </div>
            <div className="flex gap-2 items-center">
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="icon" title="Play a playlist to this group">
                    <Play className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Select Playlist</DialogTitle>
                    <DialogDescription>Play a playlist to all members in this group.</DialogDescription>
                  </DialogHeader>
                  <ul className="space-y-2 mb-4">
                    {playlists.data?.map(pl => (
                      <li key={pl.id}>
                        <Button
                          className="w-full justify-start hover:bg-gray-200"
                          variant="secondary"
                          onClick={() => playGroup.mutate({ playlistId: pl.id, groupId: g.id })}
                          disabled={playGroup.isPending}
                        >
                          {pl.name}
                        </Button>
                      </li>
                    ))}
                  </ul>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="secondary">Close</Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button variant="secondary" size="icon" asChild>
                <Link href={`/admin/groups/${g.id}`}>
                  <Pencil className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="destructive" size="icon" onClick={() => del.mutate({ id: g.id })} disabled={del.isPending}>
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
