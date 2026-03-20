"use client";

import { useState, useCallback, type ReactNode } from "react";
import { Session } from "@/types";
type PreviewTab = "figma" | "prototype" | "slides";

const TABS: { key: PreviewTab; label: string; iconSrc: string }[] = [
  {
    key: "figma",
    label: "Figma",
    iconSrc: "/icons/figma.png",
  },
  {
    key: "prototype",
    label: "Prototype",
    iconSrc: "/icons/prototype.png",
  },
  {
    key: "slides",
    label: "Slide",
    iconSrc: "/icons/slides.png",
  },
];

interface DesignPreviewProps {
  session: Session;
  isClosed: boolean;
}

export default function DesignPreview({
  session,
  isClosed,
}: DesignPreviewProps) {
  const [activeTab, setActiveTab] = useState<PreviewTab>("figma");
  const [isLoading, setIsLoading] = useState(true);

  const getUrl = useCallback(
    (tab: PreviewTab) => {
      switch (tab) {
        case "figma":
          return session.figmaUrl;
        case "prototype":
          return session.prototypeUrl;
        case "slides":
          return session.slidesUrl;
      }
    },
    [session]
  );

  const handleTabChange = (tab: PreviewTab) => {
    setActiveTab(tab);
    setIsLoading(true);
  };

  const currentUrl = getUrl(activeTab);

  return (
    <div className="flex-1 flex flex-col min-w-0 rounded-xl overflow-hidden">
      {/* Top toggle bar */}
      <div
        className="flex items-center justify-between flex-shrink-0"
        style={{
          background: "#FCFCFC",
          boxShadow: "0 4px 16px 0 rgba(0,0,0,0.04)",
          padding: "8px 12px",
          zIndex: 1,
        }}
      >
        <div className="flex items-center gap-1">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`inline-flex items-center gap-1.5 text-[14px] font-medium transition-all duration-150 cursor-pointer ${
                  !isActive ? "tab-btn-idle" : ""
                }`}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  background: isActive ? "#F3F3F3" : "transparent",
                  color: "#171717",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={tab.iconSrc}
                  alt={tab.label}
                  className="flex-shrink-0"
                  style={{ height: "16px", width: "auto" }}
                />
                {tab.label}
              </button>
            );
          })}
        </div>

        <a
          href={currentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-[14px] font-semibold transition-all duration-150 tab-btn-idle"
          style={{
            gap: "8px",
            padding: "6px 12px",
            borderRadius: "6px",
            color: "#171717",
            background: "transparent",
          }}
        >
          Open
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="flex-shrink-0"
          >
            <path
              d="M8 1.75C8 1.33579 8.33579 1 8.75 1H14.25C14.6642 1 15 1.33579 15 1.75V7.25C15 7.66421 14.6642 8 14.25 8C13.8358 8 13.5 7.66421 13.5 7.25V3.56066L6.40533 10.6553C6.11244 10.9482 5.63756 10.9482 5.34467 10.6553C5.05178 10.3624 5.05178 9.88756 5.34467 9.59467L12.4393 2.5H8.75C8.33579 2.5 8 2.16421 8 1.75Z"
              fill="#474E5A"
            />
            <path
              d="M2.5 4.75C2.5 4.05964 3.05964 3.5 3.75 3.5H5.625C6.03921 3.5 6.375 3.16421 6.375 2.75C6.375 2.33579 6.03921 2 5.625 2H3.75C2.23122 2 1 3.23122 1 4.75V12.25C1 13.7688 2.23122 15 3.75 15H11.25C12.7688 15 14 13.7688 14 12.25V10.375C14 9.96079 13.6642 9.625 13.25 9.625C12.8358 9.625 12.5 9.96079 12.5 10.375V12.25C12.5 12.9404 11.9404 13.5 11.25 13.5H3.75C3.05964 13.5 2.5 12.9404 2.5 12.25V4.75Z"
              fill="#474E5A"
            />
          </svg>
        </a>
      </div>

      {/* Preview area */}
      <div className="flex-1 relative overflow-hidden" style={{ background: "#F6F7F8" }}>
        {isLoading && (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center"
            style={{ background: "#F6F7F8" }}
          >
            <div className="space-y-4 w-full max-w-2xl px-8">
              <div className="h-6 bg-gray-200 rounded-md animate-pulse w-1/3" />
              <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />
              <div className="flex gap-3">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3" />
              </div>
            </div>
          </div>
        )}
        <iframe
          key={`${session.id}-${activeTab}`}
          src={currentUrl}
          className="w-full h-full border-0"
          onLoad={() => setIsLoading(false)}
          allow="fullscreen"
          title={`${session.title} — ${activeTab}`}
        />
      </div>
    </div>
  );
}
