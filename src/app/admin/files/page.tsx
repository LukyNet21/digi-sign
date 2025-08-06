'use client';

import { Eye, Play, Trash } from "lucide-react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";

export default function FilesPage() {
  const files = api.media.getFiles.useQuery()
  const utils = api.useUtils();
  const deleteFile = api.media.deleteFile.useMutation({
    onSuccess: async () => {
      await utils.media.getFiles.invalidate();
    },
  });
  const play = api.player.play.useMutation()
  return (
    <ul className="p-4 space-y-2">
      {files.data?.map((file) => (
        <li key={file.id} className="border p-2 rounded flex justify-between">
          {file.name}
          <div className="flex gap-2">
            <Link href={`/file/${file.id}`} target="_blank">
              <Button size="icon" variant="secondary"><Eye /></Button>
            </Link>
            <Button
              size="icon"
              onClick={() => play.mutate({ id: file.id })}
              disabled={play.isPending}>
              <Play />
            </Button>
            <Button
              size="icon"
              variant="destructive"
              onClick={() => deleteFile.mutate({ id: file.id })}
              disabled={deleteFile.isPending}>
              <Trash />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
