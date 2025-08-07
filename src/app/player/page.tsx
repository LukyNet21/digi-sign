"use client";

import { api } from "~/trpc/react";
import dynamic from 'next/dynamic';
import { useEffect, useRef } from "react";

const DisplayPDF = dynamic(() => import('~/components/display-pdf'), {
  ssr: false,
});

export default function Player() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const subscription = api.player.player.useSubscription(undefined, {
    onError(err) {
      console.error('Subscription error:', err);
    },
  });
  const playerData = subscription.data?.data;

  const fileQuery = api.media.getFile.useQuery(
    { id: playerData?.id ?? 0 },
    { enabled: !!playerData?.id }
  );

  useEffect(() => {
    if (!playerData || !fileQuery.data) return

    if (fileQuery.data.mimeType.startsWith('video/') && videoRef.current) {
      const video = videoRef.current;
      const startPlayback = () => {
        if (Date.now() < playerData.startTime) {
          setTimeout(() => {
            video.play().catch(e => {
              console.error("Video play error: " + e)
            });
          }, playerData.startTime - Date.now());
        } else {
          const elapsedSeconds = (Date.now() - playerData.startTime) / 1000;
          const targetTime = elapsedSeconds % video.duration;
          video.currentTime = targetTime;
          if (video.readyState >= 3) {
            video.play().catch(e => {
              console.error("Video play error: " + e)
            });
          } else {
            video.addEventListener('canplay', () => {
              video.play().catch(e => {
                console.error("Video play error: " + e)
              });
            }, { once: true });
          }
        }
      };
      if (video.readyState >= 1) {
        startPlayback();
      } else {
        video.addEventListener('loadedmetadata', startPlayback, { once: true });
      }
    }

  }, [playerData, fileQuery.data])

  if (!playerData) {
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
      <div className="flex flex-col items-center justify-center min-h-screen">
        <img
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
      <div className="flex flex-col items-center justify-center min-h-screen">
        <video
          ref={videoRef}
          src={`/file/${file.id}`}
          muted
          loop
          preload="metadata"
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
