"use client";

import { api } from "~/trpc/react";
import dynamic from 'next/dynamic';
import Image from "next/image";

const DisplayPDF = dynamic(() => import('~/components/display-pdf'), {
  ssr: false,
});

export default function Player() {
  const subscription = api.player.player.useSubscription();
  const fileId = subscription.data;

  const fileQuery = api.media.getFile.useQuery(
    { id: fileId! },
    { enabled: !!fileId }
  );

  if (!fileId) {
    return <div>Waiting for content...</div>;
  }

  if (fileQuery.isLoading) {
    return <div>Loading file...</div>;
  }

  if (fileQuery.error) {
    return <div>Error loading file: {fileQuery.error.message}</div>;
  }

  if (!fileQuery.data) {
    return <div>File not found</div>;
  }

  const file = fileQuery.data;

  // Check if it's an image
  if (file.mimeType.startsWith('image/')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Image
          src={`/file/${file.id}`}
          alt={file.name}
          className="max-w-full max-h-screen object-contain"
        />
      </div>
    );
  }

  // Check if it's a video
  if (file.mimeType.startsWith('video/')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <video
          src={`/file/${file.id}`}
          autoPlay
          muted
          loop
          className="max-w-full max-h-screen"
          style={{ maxHeight: 'calc(100vh - 120px)' }}
        >
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  // Check if it's a PDF
  if (file.mimeType === 'application/pdf') {
    return (
      <div className="w-full h-screen">
        <DisplayPDF id={file.id} />
      </div>
    );
  }

  // For non-image/video/PDF files, show file info
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <p className="text-gray-600">File type: {file.mimeType}</p>
      <p className="text-gray-600">Size: {(file.size / 1024).toFixed(2)} KB</p>
      <p className="text-sm text-gray-500 mt-4">
        Images, videos, and PDFs are supported for display
      </p>
    </div>
  );


}
