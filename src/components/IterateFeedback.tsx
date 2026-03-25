"use client";

import { useState } from "react";
import { Feedback, LEVEL_CONFIG } from "@/types";
import FeedbackCard from "./FeedbackCard";

interface IterateFeedbackProps {
  feedback: Feedback[];
  hasImage: boolean;
  isGenerating: boolean;
  error: string | null;
  onRegenerate: () => void;
  onHoverFeedback?: (bbox: { x: number; y: number; width: number; height: number } | null) => void;
  onResolve?: (id: string) => void;
  onIterate?: (id: string) => void;
  onRefineFeedback?: (id: string, newRationale: string, thread: { role: "user" | "assistant"; text: string }[]) => void;
  width?: number;
}

export default function IterateFeedback({
  feedback,
  hasImage,
  isGenerating,
  error,
  onRegenerate,
  onHoverFeedback,
  onResolve,
  onIterate,
  onRefineFeedback,
  width,
}: IterateFeedbackProps) {
  const hasFeedback = feedback.length > 0;
  const [iteratingId, setIteratingId] = useState<string | null>(null);
  const [iterationText, setIterationText] = useState("");
  const [isRefining, setIsRefining] = useState(false);

  const handleSubmitIteration = async () => {
    if (!iterationText.trim() || !iteratingItem || isRefining) return;
    setIsRefining(true);
    const existingThread = iteratingItem.conversationThread ?? [];
    const conversationHistory: { role: "user" | "assistant"; text: string }[] = existingThread.length > 0
      ? existingThread
      : [{ role: "assistant" as const, text: `${iteratingItem.text}${iteratingItem.rationale ? `\n\nSuggested change: ${iteratingItem.rationale}` : ""}` }];
    try {
      const res = await fetch("/api/taste", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationHistory, userReply: iterationText }),
      });
      const data = await res.json();
      if (res.ok && data.text) {
        const newThread: { role: "user" | "assistant"; text: string }[] = [
          ...conversationHistory,
          { role: "user" as const, text: iterationText },
          { role: "assistant" as const, text: data.text },
        ];
        onRefineFeedback?.(iteratingItem.id, data.text, newThread);
        setIterationText("");
      }
    } catch {
      // silent — leave text so user can retry
    } finally {
      setIsRefining(false);
    }
  };

  const iteratingItem = iteratingId ? feedback.find((f) => f.id === iteratingId) ?? null : null;
  const iteratingIndex = iteratingId ? feedback.findIndex((f) => f.id === iteratingId) : -1;

  // Iterate detail view
  if (iteratingItem) {
    const config = LEVEL_CONFIG[iteratingItem.level];
    return (
      <aside
        className="flex flex-col h-full rounded-xl bg-white overflow-hidden flex-shrink-0"
        style={{ boxShadow: "0 4px 16px 0 rgba(0,0,0,0.04)", width: width ?? 320 }}
      >
        {/* Header */}
        <div
          className="px-4 h-[50px] flex items-center justify-between flex-shrink-0"
          style={{ borderBottom: "1px solid #D4DEE9" }}
        >
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setIteratingId(null); setIterationText(""); }}
              className="text-gray-500 hover:text-gray-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span
              className="text-[15px] font-semibold text-black"
              style={{ fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif' }}
            >
              Feedback {iteratingIndex + 1}
            </span>
          </div>
          <span
            className={`inline-flex items-center gap-1 px-[9px] py-[3px] rounded-[4px] text-[12px] font-medium border ${config.bg} ${config.color} ${config.border}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
            {config.label}
          </span>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-3 flex flex-col gap-2" style={{ borderBottom: "1px solid #D4DEE9" }}>
            {/* Feedback text */}
            <p className="text-[12px] text-[#364153] leading-[16px]">
              {iteratingItem.text}
            </p>

            {/* Suggested Change box */}
            {iteratingItem.rationale && (
              <div className="flex flex-col gap-2 p-2 rounded-[4px]" style={{ background: "#F4F7FA" }}>
                <div className="flex flex-col gap-1">
                  <p className="text-[12px] font-semibold text-black leading-[16px] tracking-[-0.024px]">
                    Suggested Change
                  </p>
                  <p className="text-[12px] text-black leading-[16px]">
                    {iteratingItem.rationale}
                  </p>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => { onResolve?.(iteratingItem.id); setIteratingId(null); }}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-[4px] text-[12px] font-semibold text-white hover:opacity-90 active:scale-[0.98] transition-opacity"
                    style={{ background: "#19273C" }}
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Implement
                  </button>
                </div>
              </div>
            )}

            {/* Text area */}
            <div className="relative rounded-[4px] overflow-hidden" style={{ border: "1px solid #432dd7", height: "108px" }}>
              <textarea
                value={iterationText}
                onChange={(e) => setIterationText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmitIteration(); }}
                placeholder="Describe your iteration or response..."
                className="w-full h-full resize-none p-2 pb-10 text-[12px] text-[#364153] leading-[18px] outline-none placeholder:text-[rgba(54,65,83,0.5)] bg-white"
                disabled={isRefining}
              />
              <div className="absolute bottom-1.5 right-1.5">
                <button
                  onClick={handleSubmitIteration}
                  disabled={!iterationText.trim() || isRefining}
                  className="w-7 h-7 rounded-[4px] flex items-center justify-center transition-opacity disabled:opacity-40"
                  style={{ background: "#F7F5FD" }}
                >
                  {isRefining ? (
                    <svg className="w-3.5 h-3.5 text-[#675DFF] animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5 text-[#675DFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 12h12" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className="flex flex-col h-full rounded-xl bg-white overflow-hidden flex-shrink-0"
      style={{ boxShadow: "0 4px 16px 0 rgba(0,0,0,0.04)", width: width ?? 320 }}
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
        {isGenerating && !hasFeedback ? (
          /* Loading — either fetching Figma frame or running critique */
          <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-3">
            <svg className="w-5 h-5 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-[13px] font-medium text-indigo-500">
              {!hasImage ? "Loading Figma frame..." : "Analyzing design..."}
            </p>
          </div>
        ) : error && !hasFeedback ? (
          /* Error state */
          <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-3">
            <p className="text-[12px] text-red-500 bg-red-50 px-3 py-2 rounded-md text-left">{error}</p>
            <button
              onClick={onRegenerate}
              className="text-[12px] text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Try again
            </button>
          </div>
        ) : !hasImage ? (
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
                variant="iterate"
                onHover={() => onHoverFeedback?.(fb.bbox ?? null)}
                onHoverEnd={() => onHoverFeedback?.(null)}
                onResolve={onResolve}
                onIterate={(id) => { onIterate?.(id); setIteratingId(id); }}
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
