'use client';

import { useState } from 'react';
import { api } from "~/trpc/react";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');

  const utils = api.useUtils();
  const upload = api.media.uploadFile.useMutation({
    onSuccess: (res) => {
      setMessage(`Uploaded to ${res.url}`);
      setFile(null);
    },
    onError: () => setMessage('Upload failed'),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const buffer = await file.arrayBuffer();
    await upload.mutateAsync({
      name: name,
      filename: file.name,
      type: file.type,
      content: new Uint8Array(buffer),
    });
    await utils.media.invalidate();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 max-w-md mx-auto space-y-4 bg-white shadow-md border border-gray-200 rounded-lg"
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter file name or description"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          File
        </label>
        <input
          type="file"
          accept=".mp4,.pdf,image/png,image/jpeg,image/gif,image/webp"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
        />
      </div>

      <button
        type="submit"
        disabled={!file || upload.isPending}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition disabled:opacity-50"
      >
        {upload.isPending ? 'Uploading...' : 'Upload'}
      </button>

      {message && (
        <p className="text-sm text-center text-green-600">
          {message}
        </p>
      )}
    </form>

  );
}

