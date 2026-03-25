"use client";

import { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { Feedback, LEVEL_CONFIG } from "@/types";

interface FeedbackCardProps {
  feedback: Feedback;
  onUpvote: (id: string) => void;
  isSelected?: boolean;
  onSelect?: (id: string | null) => void;
}

export default function FeedbackCard({
  feedback,
  onUpvote,
  isSelected,
  onSelect,
}: FeedbackCardProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const config = LEVEL_CONFIG[feedback.level];

  const isAI = feedback.source === "ai";
  const isKudos = feedback.level === "kudos";
  const isSelectable = !!onSelect && !!feedback.figmaNodeId;

  useEffect(() => {
    if (isKudos) {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#10b981", "#34d399", "#6ee7b7", "#ffd700", "#ffffff"],
        scalar: 0.8,
        disableForReducedMotion: true,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpvote = () => {
    setIsAnimating(true);
    onUpvote(feedback.id);
    setTimeout(() => setIsAnimating(false), 600);
  };

  const handleClick = () => {
    if (!isSelectable) return;
    onSelect?.(isSelected ? null : feedback.id);
  };

  const initials = isAI
    ? "AI"
    : feedback.reviewerName
        .split(" ")
        .map((n) => n[0])
        .join("");

  return (
    <div
      onClick={handleClick}
      className={`group px-4 py-3 transition-colors duration-100 border-b border-gray-100 last:border-0 ${
        isKudos ? "bg-emerald-50/40" : "hover:bg-gray-50/80"
      } ${isAI ? "border-l-2 border-l-indigo-200" : ""} ${
        isSelectable ? "cursor-pointer" : ""
      } ${isSelected ? "ring-2 ring-inset ring-indigo-400/60" : ""}`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
            isAI ? "bg-indigo-100" : "bg-gray-200"
          }`}
        >
          <span
            className={`text-[10px] font-semibold ${
              isAI ? "text-indigo-600" : "text-gray-600"
            }`}
          >
            {initials}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[13px] font-medium text-gray-900 flex items-center gap-1">
              {isKudos && <span className="text-emerald-500">★</span>}
              {feedback.reviewerName}
            </span>
            {isAI && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100 text-[10px] font-semibold">
                ✦ Taste AI
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${config.bg} ${config.color} border ${config.border}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
              {config.label}
            </span>
            <span className="text-[11px] text-gray-400 ml-auto whitespace-nowrap">
              {feedback.timestamp}
            </span>
          </div>

          {/* Body */}
          <p className="text-[13px] text-gray-600 leading-relaxed">
            {feedback.text}
          </p>

          {/* AI rationale */}
          {isAI && feedback.rationale && (
            <p className="mt-1 text-[11px] text-indigo-500 italic leading-relaxed">
              {feedback.rationale}
            </p>
          )}

          {/* Screenshot preview */}
          {feedback.screenshotUrl && (
            <div className="mt-2 rounded-md border border-gray-200 overflow-hidden w-fit">
              <img
                src={feedback.screenshotUrl}
                alt="Screenshot"
                className="max-h-32 object-cover"
              />
            </div>
          )}

          {/* Footer: upvote + figma link hint */}
          <div className="flex items-center gap-2 mt-2">
            {!isAI && (
              <button
                onClick={(e) => { e.stopPropagation(); handleUpvote(); }}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition-all duration-150 ${
                  feedback.upvotes > 0
                    ? "text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-100 opacity-0 group-hover:opacity-100"
                }`}
              >
                <svg
                  className={`w-3 h-3 transition-transform duration-300 ${isAnimating ? "scale-125" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                </svg>
                <span className={`transition-transform duration-300 ${isAnimating ? "-translate-y-0.5" : ""}`}>
                  {feedback.upvotes > 0 ? feedback.upvotes : "+1"}
                </span>
              </button>
            )}
            {isSelectable && !isSelected && (
              <span className="text-[11px] text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                Click to view in Figma
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
