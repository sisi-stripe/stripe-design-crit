"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface Bbox { x: number; y: number; width: number; height: number }

interface ImageCanvasProps {
  imageDataUrl?: string;
  projectTitle?: string;
  onImageDrop: (dataUrl: string, mediaType: string) => void;
  onImageClear: () => void;
  highlightBbox?: Bbox | null;
}

export default function ImageCanvas({
  imageDataUrl,
  projectTitle,
  onImageDrop,
  onImageClear,
  highlightBbox,
}: ImageCanvasProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties | null>(null);

  const computeHighlight = useCallback(() => {
    if (!highlightBbox || !imgRef.current || !containerRef.current) {
      setHighlightStyle(null);
      return;
    }
    const img = imgRef.current;
    const container = containerRef.current;
    if (!img.naturalWidth || !img.naturalHeight) return;

    const imgRect = img.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const { naturalWidth: nw, naturalHeight: nh } = img;
    // Subtract padding (24px each side) to get the content box where object-contain renders
    const padding = 24;
    const elW = img.clientWidth - padding * 2;
    const elH = img.clientHeight - padding * 2;
    const naturalRatio = nw / nh;
    const elRatio = elW / elH;

    let renderW: number, renderH: number, renderX: number, renderY: number;
    // Offset into the content box (past the padding)
    const contentLeft = imgRect.left - containerRect.left + padding;
    const contentTop = imgRect.top - containerRect.top + padding;

    if (naturalRatio > elRatio) {
      renderW = elW;
      renderH = elW / naturalRatio;
      renderX = contentLeft;
      renderY = contentTop + (elH - renderH) / 2;
    } else {
      renderH = elH;
      renderW = elH * naturalRatio;
      renderX = contentLeft + (elW - renderW) / 2;
      renderY = contentTop;
    }

    setHighlightStyle({
      left: renderX + highlightBbox.x * renderW,
      top: renderY + highlightBbox.y * renderH,
      width: highlightBbox.width * renderW,
      height: highlightBbox.height * renderH,
    });
  }, [highlightBbox]);

  useEffect(() => {
    computeHighlight();
  }, [computeHighlight]);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      onImageDrop(reader.result as string, file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center h-full rounded-xl bg-white overflow-hidden"
      style={{
        width: "100%",
        boxShadow: "0 4px 16px 0 rgba(0,0,0,0.04)",
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInputChange}
      />

      {imageDataUrl ? (
        <>
          {/* Image display */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={imageDataUrl}
            alt="Design for critique"
            className="max-w-full max-h-full object-contain"
            style={{ padding: "24px" }}
            onLoad={computeHighlight}
          />

          {/* Hover highlight overlay */}
          {highlightStyle && (
            <div
              className="absolute pointer-events-none"
              style={{
                ...highlightStyle,
                borderRadius: "3px",
                border: "1.5px solid #675dff",
                background: "rgba(103, 93, 255, 0.06)",
                outline: "1px solid rgba(103, 93, 255, 0.2)",
                outlineOffset: "2px",
                boxShadow: "0 0 0 2000px rgba(0, 0, 0, 0.18)",
                transition: "left 0.12s ease, top 0.12s ease, width 0.12s ease, height 0.12s ease",
              }}
            />
          )}

          {/* Project title pill */}
          {projectTitle && (
            <div className="absolute bottom-4 left-4 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-sm">
              <span className="text-[12px] font-medium text-white">{projectTitle}</span>
            </div>
          )}

          {/* Remove button */}
          <button
            onClick={onImageClear}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors"
            title="Remove image"
          >
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </>
      ) : (
        /* Drop zone */
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center transition-colors duration-150 cursor-pointer rounded-[16px]"
          style={{
            width: "507px",
            height: "315px",
            background: isDragging ? "#E8EEF5" : "#F4F7FA",
            border: `1px dashed ${isDragging ? "#A8C0D6" : "#D4DEE9"}`,
          }}
        >
          <span
            className="text-black select-none"
            style={{
              fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
              fontSize: "16px",
              fontWeight: 500,
              lineHeight: "normal",
            }}
          >
            {isDragging ? "Drop to upload" : "Drag image here"}
          </span>
        </button>
      )}
    </div>
  );
}
