"use client";

import { api } from "~/trpc/react";
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from "react";

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

  const playlistQuery = api.playlist.get.useQuery(
    { id: playerData?.id ?? 0 },
    { enabled: !!playerData?.id }
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loopCounter, setLoopCounter] = useState(0); // for playlist video loops

  // Reset index when playlist changes
  useEffect(() => {
    if (playlistQuery.data) {
      setCurrentIndex(0);
      setLoopCounter(0);
    }
  }, [playlistQuery.data]);

  const currentItem = playlistQuery.data?.items[currentIndex];
  const currentFile = currentItem?.file;

  // Timer for images
  useEffect(() => {
    if (!currentItem || !currentFile) return;
    if (!currentFile.mimeType.startsWith('image/')) return;
    const duration = currentItem.imageDisplayDurationMs ?? 5000;
    const t = setTimeout(() => {
      setCurrentIndex((i) => {
        const len = playlistQuery.data?.items.length ?? 0;
        return len > 0 ? (i + 1) % len : 0;
      });
    }, Math.max(500, duration));
    return () => clearTimeout(t);
  }, [currentIndex, currentItem, currentFile, playlistQuery.data]);

  // Reset video loop counter when playlist item changes
  useEffect(() => {
    if (playlistQuery.data) setLoopCounter(0);
  }, [currentIndex, playlistQuery.data]);

  if (!playerData) {
    return <div>Waiting for content...</div>;
  }

  if (playlistQuery.data) {
    const pl = playlistQuery.data;
    const item = pl.items[currentIndex];

  if (!item?.file) {
      return <div>Playlist empty</div>;
    }

    const file = item.file;
    const next = () => setCurrentIndex((i) => (i + 1) % pl.items.length);

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

    if (file.mimeType.startsWith('video/')) {
      const loops = item.videoLoopCount ?? 1;
      const onEnded = () => {
        const newCount = loopCounter + 1;
        if (newCount >= Math.max(1, loops)) {
          setLoopCounter(0);
          next();
        } else {
          setLoopCounter(newCount);
          if (videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play().catch((e) => { console.error("Video play error:" + e) });
          }
        }
      };

      return (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <video
            key={`${file.id}-${currentIndex}`}
            ref={videoRef}
            src={`/file/${file.id}`}
            muted
            preload="metadata"
            className="max-w-full max-h-screen"
            style={{ maxHeight: 'calc(100vh - 120px)' }}
            onEnded={onEnded}
            autoPlay
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    if (file.mimeType === 'application/pdf') {
      const pageDuration = item.pdfPageDurationMs ?? 5000;
      const docLoops = item.pdfDocumentLoopCount ?? 1;
      return (
        <div className="w-full h-screen">
          <DisplayPDF id={file.id} pageDurationMs={pageDuration} loopCount={docLoops} onComplete={() => setCurrentIndex((i) => (i + 1) % pl.items.length)} />
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <p className="text-gray-600">File type: {file.mimeType}</p>
        <p className="text-gray-600">Size: {(file.size / 1024).toFixed(2)} KB</p>
      </div>
    );
  }

  if (playlistQuery.isLoading) {
    return <div>Loading playlist...</div>;
  }
  return <div>Playlist not found</div>;
}
