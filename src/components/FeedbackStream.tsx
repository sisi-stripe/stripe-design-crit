"use client";

import { useState, useMemo } from "react";
import { Feedback, LevelOfConcern } from "@/types";
import FeedbackCard from "./FeedbackCard";
import FeedbackComposer from "./FeedbackComposer";

type SortMode = "latest" | "upvotes" | "blocking";

const SORT_OPTIONS: { key: SortMode; label: string }[] = [
  { key: "latest", label: "Latest" },
  { key: "upvotes", label: "Most upvoted" },
  { key: "blocking", label: "Blocking first" },
];

interface FeedbackStreamProps {
  feedback: Feedback[];
  isClosed: boolean;
  onUpvote: (id: string) => void;
  onSubmit: (data: {
    reviewerName: string;
    level: LevelOfConcern;
    text: string;
    screenshotUrl?: string;
  }) => void;
  sessionTitle: string;
  selectedFeedbackId?: string | null;
  onSelectFeedback?: (id: string | null) => void;
}

export default function FeedbackStream({
  feedback,
  isClosed,
  onUpvote,
  onSubmit,
  sessionTitle,
  selectedFeedbackId,
  onSelectFeedback,
}: FeedbackStreamProps) {
  const [sortMode, setSortMode] = useState<SortMode>("latest");

  const sorted = useMemo(() => {
    const items = [...feedback];
    switch (sortMode) {
      case "upvotes":
        return items.sort((a, b) => b.upvotes - a.upvotes);
      case "blocking": {
        const priority: Record<string, number> = {
          blocking: 0,
          consider: 1,
          idea: 2,
          question: 3,
          kudos: 4,
        };
        return items.sort(
          (a, b) => (priority[a.level] ?? 5) - (priority[b.level] ?? 5)
        );
      }
      default:
        return items;
    }
  }, [feedback, sortMode]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3" style={{ borderBottom: "1px solid #ECEEF1" }}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[15px] font-semibold text-gray-900">Feedback</h2>
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-medium" style={{ color: "#7D8BA4" }}>
              {feedback.length} {feedback.length === 1 ? "item" : "items"}
            </span>
          </div>
        </div>

        {/* Sort controls */}
        <div className="flex items-center gap-0.5">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSortMode(opt.key)}
              className={`px-2.5 py-1 rounded-md text-[12px] font-medium transition-colors ${
                sortMode === opt.key
                  ? "bg-gray-900 text-white"
                  : "hover:bg-gray-100"
              }`}
              style={sortMode !== opt.key ? { color: "#7D8BA4" } : undefined}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback list */}
      <div className="flex-1 overflow-y-auto">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <p className="text-[13px] font-medium text-gray-500">
              No feedback yet
            </p>
            <p className="text-[12px] text-gray-400 mt-1">
              {isClosed
                ? "This session ended without feedback."
                : `Be the first to share thoughts on "${sessionTitle}".`}
            </p>
          </div>
        ) : (
          sorted.map((fb) => (
            <FeedbackCard
              key={fb.id}
              feedback={fb}
              onUpvote={onUpvote}
              isSelected={fb.id === selectedFeedbackId}
              onSelect={onSelectFeedback}
            />
          ))
        )}
      </div>

      {/* Composer */}
      <FeedbackComposer onSubmit={onSubmit} disabled={isClosed} />
    </div>
  );
}
