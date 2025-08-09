'use client'

import { Document, Page, pdfjs } from 'react-pdf';
import { useEffect, useRef, useState } from "react";

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

export default function DisplayPDF({ id, pageDurationMs = 5000, loopCount = 1, onComplete }: { id: number; pageDurationMs?: number; loopCount?: number; onComplete?: () => void }) {
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1);
  const [pageDimensions, setPageDimensions] = useState<{ width: number; height: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!numPages) return;
    let pagesShown = 0;
    const totalPagesToShow = numPages * Math.max(1, loopCount ?? 1);
    setPageNumber(1);

    const interval = setInterval(() => {
      pagesShown += 1;
      setPageNumber((prev) => {
        const next = prev < numPages ? prev + 1 : 1;
        return next;
      });
      if (pagesShown >= totalPagesToShow) {
        clearInterval(interval);
        onComplete?.();
      }
    }, Math.max(500, pageDurationMs));

    return () => clearInterval(interval);
  }, [numPages, pageDurationMs, loopCount, onComplete]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  useEffect(() => {
    const resize = () => {
      if (!containerRef.current || !pageDimensions) return;

      const { offsetWidth, offsetHeight } = containerRef.current;

      const scaleX = offsetWidth / pageDimensions.width;
      const scaleY = offsetHeight / pageDimensions.height;

      const scaleToFit = Math.min(scaleX, scaleY);
      setScale(scaleToFit);
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [pageDimensions]);

  return (
    <div
      ref={containerRef}
      className="w-screen h-screen overflow-hidden flex items-center justify-center bg-black"
    >
      <Document file={`/file/${id}`} onLoadSuccess={onDocumentLoadSuccess}>
        <Page
          pageNumber={pageNumber}
          scale={scale}
          onLoadSuccess={(page) => {
            const { width, height } = page.getViewport({ scale: 1 });
            setPageDimensions({ width, height });
          }}
        />
      </Document>
    </div>
  );
}