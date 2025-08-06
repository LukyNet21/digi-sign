'use clinet'

import { Document, Page, pdfjs } from 'react-pdf';
import { useEffect, useRef, useState } from "react";

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

export default function DisplayPDF({ id }: { id: number }) {
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1);
  const [pageDimensions, setPageDimensions] = useState<{ width: number; height: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Page rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setPageNumber((prev) =>
        numPages && prev < numPages ? prev + 1 : 1
      );
    }, 5000);
    return () => clearInterval(interval);
  }, [numPages]);

  // Set number of pages on document load
  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  // Recalculate scale when page dimensions or screen size changes
  useEffect(() => {
    const resize = () => {
      if (!containerRef.current || !pageDimensions) return;

      const { offsetWidth, offsetHeight } = containerRef.current;

      const scaleX = offsetWidth / pageDimensions.width;
      const scaleY = offsetHeight / pageDimensions.height;

      const scaleToFit = Math.min(scaleX, scaleY);
      setScale(scaleToFit);
    };

    resize(); // Initial
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