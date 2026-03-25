"use client";

import { Feedback, LEVEL_CONFIG } from "@/types";
import FeedbackCard from "./FeedbackCard";

interface IterateFeedbackProps {
  feedback: Feedback[];
  hasImage: boolean;
  isGenerating: boolean;
  error: string | null;
  onRegenerate: () => void;
}

export default function IterateFeedback({
  feedback,
  hasImage,
  isGenerating,
  error,
  onRegenerate,
}: IterateFeedbackProps) {
  const hasFeedback = feedback.length > 0;

  return (
    <aside
      className="flex-1 flex flex-col h-full rounded-xl bg-white overflow-hidden"
      style={{ boxShadow: "0 4px 16px 0 rgba(0,0,0,0.04)" }}
    >
      {/* Header */}
      <div
        className="px-4 pt-4 pb-3 flex items-center justify-between flex-shrink-0"
        style={{ borderBottom: "1px solid #ECEEF1" }}
      >
        <h2
          className="text-[15px] font-semibold text-gray-900"
          style={{ fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif' }}
        >
          Feedback
        </h2>
        {hasFeedback && !isGenerating && (
          <button
            onClick={onRegenerate}
            className="text-[11px] text-gray-400 hover:text-indigo-600 transition-colors"
          >
            Regenerate
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {!hasImage ? (
          /* No image */
          <div className="flex flex-col items-center justify-center h-full px-6 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 20.25h18M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5z" />
              </svg>
            </div>
            <p className="text-[13px] font-medium text-gray-500">No image yet</p>
            <p className="text-[12px] text-gray-400 mt-1">Drop an image to start your critique.</p>
          </div>
        ) : isGenerating && !hasFeedback ? (
          /* Generating — first time */
          <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-3">
            <svg className="w-5 h-5 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-[13px] font-medium text-indigo-500">Analyzing design...</p>
          </div>
        ) : error && !hasFeedback ? (
          /* Error state */
          <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-3">
            <p className="text-[12px] text-red-500 bg-red-50 px-3 py-2 rounded-md">{error}</p>
            <button
              onClick={onRegenerate}
              className="text-[12px] text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Try again
            </button>
          </div>
        ) : (
          /* Feedback items */
          <>
            {isGenerating && (
              <div className="flex items-center gap-2 text-[12px] text-indigo-500 px-4 py-2 border-b border-gray-100">
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Regenerating critique...
              </div>
            )}
            {error && (
              <p className="text-[11px] text-red-500 bg-red-50 px-4 py-2 mx-4 rounded-md mt-2">{error}</p>
            )}
            {feedback.map((fb) => (
              <FeedbackCard
                key={fb.id}
                feedback={fb}
                onUpvote={() => {}}
              />
            ))}
            {/* Level breakdown */}
            <div className="flex items-center gap-3 text-[11px] text-gray-400 px-4 py-3 border-t border-gray-100 flex-wrap">
              {(["blocking", "consider", "kudos", "question", "idea"] as const).map((level) => {
                const count = feedback.filter((f) => f.level === level).length;
                if (count === 0) return null;
                const cfg = LEVEL_CONFIG[level];
                return (
                  <span key={level} className={`inline-flex items-center gap-1 ${cfg.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    {count} {cfg.label.toLowerCase()}
                  </span>
                );
              })}
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
