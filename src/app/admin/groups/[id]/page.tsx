'use client';

import { useRouter, useParams } from 'next/navigation';
import { api } from '~/trpc/react';
import { useEffect, useState } from 'react';
import { Button } from '~/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '~/components/ui/dialog';
import { Play } from 'lucide-react';

export default function EditGroupPage() {
  const params = useParams<{ id: string }>();
  const id = params.id === 'new' ? null : Number(params.id);
  const router = useRouter();

  const groupQuery = api.group.get.useQuery({ id: id ?? 0 }, { enabled: id !== null });
  const create = api.group.create.useMutation({ onSuccess: (g) => router.replace(`/admin/groups/${g.id}`) });
  const update = api.group.update.useMutation();

  const allPlayers = api.player.list.useQuery();
  const allPlaylists = api.playlist.list.useQuery();
  const playGroup = api.player.playGroup.useMutation();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [memberIds, setMemberIds] = useState<number[]>([]);

  useEffect(() => {
    if (groupQuery.data && id) {
      const g = groupQuery.data;
      setName(g.name);
      setDescription(g.description ?? '');
      setMemberIds(g.members.map(m => m.id));
    }
  }, [groupQuery.data, id]);

  const toggleMember = (pid: number) => {
    setMemberIds(prev => prev.includes(pid) ? prev.filter(x => x !== pid) : [...prev, pid]);
  };

  const save = async () => {
    if (!name.trim()) return;
    if (id === null) {
      await create.mutateAsync({ name, description, memberIds });
    } else {
      await update.mutateAsync({ id, name, description, memberIds });
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{id ? 'Edit Group' : 'New Group'}</h1>
        {id && (
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
                {allPlaylists.data?.map(pl => (
                  <li key={pl.id}>
                    <Button
                      className="w-full justify-start hover:bg-gray-200"
                      variant="secondary"
                      onClick={() => playGroup.mutate({ playlistId: pl.id, groupId: id })}
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
        )}
      </div>

      <div className="space-y-2">
        <input className="border px-2 py-1 w-full" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
        <textarea className="border px-2 py-1 w-full" placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
      </div>

      <div>
        <h2 className="font-semibold mb-2">Members</h2>
        <ul className="space-y-2">
          {allPlayers.data?.map(p => (
            <li key={p.id} className="flex items-center gap-2">
              <input type="checkbox" checked={memberIds.includes(p.id)} onChange={() => toggleMember(p.id)} />
              <span>{p.name}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex gap-2">
        <Button onClick={save} disabled={create.isPending || update.isPending}>{id ? 'Save' : 'Create'}</Button>
        <Button variant="secondary" onClick={() => router.push('/admin/groups')}>Back</Button>
      </div>
    </div>
  );
}
