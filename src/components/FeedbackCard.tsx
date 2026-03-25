"use client";

import { useState } from "react";
import confetti from "canvas-confetti";
import { Feedback, LEVEL_CONFIG } from "@/types";

interface FeedbackCardProps {
  feedback: Feedback;
  onUpvote: (id: string) => void;
  isSelected?: boolean;
  onSelect?: (id: string | null) => void;
  onHover?: () => void;
  onHoverEnd?: () => void;
  variant?: "default" | "iterate";
  onResolve?: (id: string) => void;
  onIterate?: (id: string) => void;
}

export default function FeedbackCard({
  feedback,
  onUpvote,
  isSelected,
  onSelect,
  onHover,
  onHoverEnd,
  variant = "default",
  onResolve,
  onIterate,
}: FeedbackCardProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const config = LEVEL_CONFIG[feedback.level];

  const isAI = feedback.source === "ai";
  const isKudos = feedback.level === "kudos";
  const isSelectable = !!onSelect && !!feedback.figmaNodeId;

  const handleMouseEnter = () => {
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
    onHover?.();
  };

  const handleMouseLeave = () => {
    onHoverEnd?.();
  };

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

  if (variant === "iterate") {
    return (
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`px-5 py-3 border-b border-gray-100 last:border-0 transition-colors duration-100 ${
          isKudos ? "bg-emerald-50/30" : ""
        }`}
      >
        {/* Level pill */}
        <div className="mb-3">
          {feedback.approved ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Resolved
            </span>
          ) : (
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold border ${config.bg} ${config.color} ${config.border}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
              {isKudos && <span className="mr-0.5">★</span>}
              {config.label}
            </span>
          )}
        </div>

        {/* Body text */}
        <p className="text-[15px] text-gray-800 leading-relaxed mb-3">
          {feedback.text}
        </p>

        {/* Rationale */}
        {feedback.rationale && (
          <div className="mb-3">
            <p className="text-[13.5px] text-indigo-600 leading-relaxed">
              {feedback.rationale}
            </p>
          </div>
        )}

        {/* Action buttons */}
        {!feedback.approved && <div className="flex items-center gap-2">
          <button
            onClick={() => onResolve?.(feedback.id)}
            className="inline-flex items-center text-[13px] font-semibold text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
            style={{ display: "flex", padding: "4px 8px", alignItems: "center", gap: "6px", borderRadius: "4px", background: "#19273C" }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Resolve
          </button>
          <button
            onClick={() => onIterate?.(feedback.id)}
            className="inline-flex items-center text-[13px] font-semibold text-gray-800 bg-white border border-gray-200 hover:bg-gray-50 transition-colors active:scale-[0.98]"
            style={{ display: "flex", padding: "4px 8px", alignItems: "center", gap: "6px", borderRadius: "4px" }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Iterate
          </button>
        </div>}
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`group px-4 py-3.5 transition-colors duration-100 border-b border-gray-100 last:border-0 ${
        isKudos ? "bg-emerald-50/40" : "hover:bg-gray-50/60"
      } ${isSelectable ? "cursor-pointer" : ""} ${
        isSelected ? "ring-2 ring-inset ring-indigo-400/60" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 ${
            isAI ? "bg-indigo-100" : "bg-gray-200"
          }`}
        >
          <span
            className={`text-[9px] font-bold tracking-tight ${
              isAI ? "text-indigo-600" : "text-gray-600"
            }`}
          >
            {initials}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
            <span className="text-[12px] font-semibold text-gray-800">
              {isKudos && <span className="text-emerald-500 mr-0.5">★</span>}
              {feedback.reviewerName}
            </span>
            {isAI && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100 text-[10px] font-semibold">
                ✦ Taste AI
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${config.bg} ${config.color} border ${config.border}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
              {config.label}
            </span>
            <span className="text-[11px] text-gray-400 ml-auto whitespace-nowrap">
              {feedback.timestamp}
            </span>
          </div>

          {/* Body */}
          <p className="text-[12.5px] text-gray-700 leading-relaxed">
            {feedback.text}
          </p>

          {/* AI rationale */}
          {isAI && feedback.rationale && (
            <p className="mt-1.5 text-[11px] text-gray-400 italic leading-relaxed">
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
