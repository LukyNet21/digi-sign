"use client";

import Link from 'next/link';
import { api } from '~/trpc/react';
import { Button } from '~/components/ui/button';
import { Pencil, Trash } from 'lucide-react';

export default function PlayersPage() {
  const players = api.player.list.useQuery();
  const utils = api.useUtils();
  const del = api.player.delete.useMutation({
    onSuccess: async () => { await utils.player.list.invalidate(); },
  });

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
  );
}
