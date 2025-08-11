'use client';

import { useRouter, useParams } from 'next/navigation';
import { api, type RouterOutputs } from '~/trpc/react';
import { useState, useEffect } from 'react';
import { Button } from '~/components/ui/button';

type PlaylistGetOutput = RouterOutputs['playlist']['get'];
type PlaylistItemApi = NonNullable<PlaylistGetOutput>['items'][number];
interface PlaylistItemForm {
  fileId: number;
  position: number;
  imageDisplayDurationMs?: number;
  pdfPageDurationMs?: number;
  pdfDocumentLoopCount?: number;
  videoLoopCount?: number;
}

export default function EditPlaylistPage() {
  const params = useParams<{ id: string }>();
  const id = params.id === 'new' ? null : Number(params.id);
  const router = useRouter();
  const playlistQuery = api.playlist.get.useQuery({ id: id ?? 0 }, { enabled: id !== null });
  const create = api.playlist.create.useMutation({ onSuccess: (p) => router.replace(`/admin/playlists/${p.id}`) });
  const update = api.playlist.update.useMutation();
  const files = api.media.getFiles.useQuery();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<PlaylistItemForm[]>([]);

  useEffect(() => {
    if (playlistQuery.data && id) {
      const pl = playlistQuery.data;
      setName(pl.name);
      setDescription(pl.description ?? '');
      const mapped: PlaylistItemForm[] = pl.items.map((i: PlaylistItemApi) => ({
        fileId: i.fileId,
        position: i.position,
        imageDisplayDurationMs: i.imageDisplayDurationMs ?? undefined,
        pdfPageDurationMs: i.pdfPageDurationMs ?? undefined,
        pdfDocumentLoopCount: i.pdfDocumentLoopCount ?? undefined,
        videoLoopCount: i.videoLoopCount ?? undefined,
      }));
      setItems(mapped);
    }
  }, [playlistQuery.data, id]);

  const save = async () => {
    if (!name.trim()) return;
    if (id === null) {
      await create.mutateAsync({ name, description, items });
    } else {
      await update.mutateAsync({ id, name, description, items });
    }
  };

  const addItem = () => {
    if (!files.data || files.data.length === 0) return;
    const first = files.data[0];
    if (!first) return;
    setItems(prev => [...prev, { fileId: first.id, position: prev.length }]);
  };

  const updateItem = (index: number, patch: Partial<PlaylistItemForm>) => {
    setItems(prev => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index).map((it, idx) => ({ ...it, position: idx })));
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{id ? 'Edit Playlist' : 'New Playlist'}</h1>
      </div>
      <div className="space-y-2">
        <input className="border px-2 py-1 w-full" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
        <textarea className="border px-2 py-1 w-full" placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
      </div>
      <div>
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-semibold">Items</h2>
          <Button size="sm" onClick={addItem}>Add Item</Button>
        </div>
        <ul className="space-y-3">
          {items.map((it, idx) => {
            const file = files.data?.find(f => f.id === it.fileId);
            return (
              <li key={idx} className="border rounded p-3 space-y-2">
                <div className="flex gap-2 items-center">
                  <select
                    className="border px-2 py-1"
                    value={it.fileId}
                    onChange={e => updateItem(idx, { fileId: Number(e.target.value) })}
                  >
                    {files.data?.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                  <span className="text-sm text-gray-500">#{idx + 1}</span>
                  <Button variant="destructive" size="sm" onClick={() => removeItem(idx)}>Remove</Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  {file?.mimeType.startsWith('image/') && (
                    <label className="flex flex-col">Image Display (ms)
                      <input type="number" value={it.imageDisplayDurationMs ?? ''} onChange={e => updateItem(idx, { imageDisplayDurationMs: e.target.value ? Number(e.target.value) : undefined })} className="border px-2 py-1" />
                    </label>
                  )}
                  {file?.mimeType === 'application/pdf' && (
                    <>
                      <label className="flex flex-col">PDF Page Duration (ms)
                        <input type="number" value={it.pdfPageDurationMs ?? ''} onChange={e => updateItem(idx, { pdfPageDurationMs: e.target.value ? Number(e.target.value) : undefined })} className="border px-2 py-1" />
                      </label>
                      <label className="flex flex-col">PDF Loop Count
                        <input type="number" value={it.pdfDocumentLoopCount ?? ''} onChange={e => updateItem(idx, { pdfDocumentLoopCount: e.target.value ? Number(e.target.value) : undefined })} className="border px-2 py-1" />
                      </label>
                    </>
                  )}
                  {file?.mimeType.startsWith('video/') && (
                    <label className="flex flex-col">Video Loop Count
                      <input type="number" value={it.videoLoopCount ?? ''} onChange={e => updateItem(idx, { videoLoopCount: e.target.value ? Number(e.target.value) : undefined })} className="border px-2 py-1" />
                    </label>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="flex gap-2">
        <Button onClick={save} disabled={create.isPending || update.isPending}>{id ? 'Save' : 'Create'}</Button>
        <Button variant="secondary" onClick={() => router.push('/admin/playlists')}>Back</Button>
      </div>
    </div>
  );
}
