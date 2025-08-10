"use client";

import { useParams, useRouter } from 'next/navigation';
import { api } from '~/trpc/react';
import { useEffect, useState } from 'react';
import { Button } from '~/components/ui/button';

export default function EditPlayerPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const router = useRouter();
  const q = api.player.get.useQuery({ id }, { enabled: !!id });
  const update = api.player.update.useMutation();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (q.data) {
      setName(q.data.name ?? '');
      setDescription(q.data.description ?? '');
    }
  }, [q.data]);

  const save = async () => {
    if (!name.trim()) return;
    await update.mutateAsync({ id, name, description });
    router.push('/admin/players');
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Edit Player</h1>
      <div className="space-y-2">
        <input className="border px-2 py-1 w-full" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
        <textarea className="border px-2 py-1 w-full" placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <Button onClick={save} disabled={update.isPending}>Save</Button>
        <Button variant="secondary" onClick={() => router.push('/admin/players')}>Back</Button>
      </div>
    </div>
  );
}
