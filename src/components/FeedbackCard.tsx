"use client";

import { useState } from "react";
import { Feedback, LEVEL_CONFIG } from "@/types";

interface FeedbackCardProps {
  feedback: Feedback;
  onUpvote: (id: string) => void;
}

export default function FeedbackCard({
  feedback,
  onUpvote,
}: FeedbackCardProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const config = LEVEL_CONFIG[feedback.level];

  const handleUpvote = () => {
    setIsAnimating(true);
    onUpvote(feedback.id);
    setTimeout(() => setIsAnimating(false), 600);
  };

  const initials = feedback.reviewerName
    .split(" ")
    .map((n) => n[0])
    .join("");

  return (
    <div className="group px-4 py-3 hover:bg-gray-50/80 transition-colors duration-100 border-b border-gray-100 last:border-0">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-[10px] font-semibold text-gray-600">
            {initials}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[13px] font-medium text-gray-900">
              {feedback.reviewerName}
            </span>
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

          {/* Footer */}
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={handleUpvote}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition-all duration-150 ${
                feedback.upvotes > 0
                  ? "text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-100 opacity-0 group-hover:opacity-100"
              }`}
            >
              <svg
                className={`w-3 h-3 transition-transform duration-300 ${
                  isAnimating ? "scale-125" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 15l7-7 7 7"
                />
              </svg>
              <span
                className={`transition-transform duration-300 ${
                  isAnimating ? "-translate-y-0.5" : ""
                }`}
              >
                {feedback.upvotes > 0 ? feedback.upvotes : "+1"}
              </span>

              {/* Float-up animation */}
              {isAnimating && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold text-indigo-500 animate-bounce">
                  +1
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
