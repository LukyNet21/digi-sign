'use client';

import Link from 'next/link';
import { Button } from '~/components/ui/button';
import { api } from '~/trpc/react';
import { Trash, Pencil, Play } from 'lucide-react';

export default function PlaylistsPage() {
  const playlists = api.playlist.list.useQuery();
  const utils = api.useUtils();
  const del = api.playlist.delete.useMutation({
    onSuccess: async () => { await utils.playlist.list.invalidate(); }
  });
  const play = api.player.play.useMutation();

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Playlists</h1>
        <Button asChild>
          <Link href="/admin/playlists/new">New Playlist</Link>
        </Button>
      </div>
      <ul className="space-y-2">
        {playlists.data?.map(p => (
          <li key={p.id} className="border rounded p-3 flex justify-between items-center">
            <div>
              <div className="font-medium">{p.name}</div>
              {p.description && <div className="text-sm text-gray-500">{p.description}</div>}
            </div>
            <div className="flex gap-2">
              <Button size="icon" onClick={() => play.mutate({ id: p.id })} disabled={play.isPending}>
                <Play className="h-4 w-4" />
              </Button>
              <Button variant="secondary" size="icon" asChild>
                <Link href={`/admin/playlists/${p.id}`}> <Pencil className="h-4 w-4" /> </Link>
              </Button>
              <Button variant="destructive" size="icon" onClick={() => del.mutate({ id: p.id })} disabled={del.isPending}>
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
