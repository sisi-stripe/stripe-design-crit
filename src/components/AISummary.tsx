"use client";

import { useState } from "react";
import { Feedback, Session, LEVEL_CONFIG, LevelOfConcern } from "@/types";

interface AISummaryProps {
  feedback: Feedback[];
  session: Session;
  onAddAIFeedback: (items: Feedback[]) => void;
  onSendToFigma: (approvedItems: Feedback[]) => Promise<void>;
}

export default function AISummary({
  feedback,
  session,
  onAddAIFeedback,
  onSendToFigma,
}: AISummaryProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState(false);

  const approvedItems = feedback.filter(
    (f) => f.source === "ai" && f.approved === true
  );
  const allAIItems = feedback.filter((f) => f.source === "ai");
  const hasAIFeedback = allAIItems.length > 0;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const humanFeedback = feedback
        .filter((f) => f.source !== "ai")
        .map((f) => ({
          reviewerName: f.reviewerName,
          level: f.level,
          text: f.text,
        }));

      const res = await fetch("/api/taste", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          figmaUrl: session.figmaUrl,
          sessionTitle: session.title,
          humanFeedback,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || "Failed to generate critique");
        return;
      }

      const newItems: Feedback[] = data.items.map(
        (item: {
          level: LevelOfConcern;
          text: string;
          rationale: string;
          figmaNote: string;
        }) => ({
          id: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          sessionId: session.id,
          reviewerName: "Taste (AI)",
          level: item.level,
          text: item.text,
          rationale: item.rationale,
          figmaNote: item.figmaNote,
          timestamp: "Just now",
          upvotes: 0,
          source: "ai" as const,
          approved: undefined,
          conversationThread: [{ role: "assistant" as const, text: item.text }],
        })
      );

      onAddAIFeedback(newItems);
    } catch {
      setError("Network error — check console");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSend = async () => {
    if (approvedItems.length === 0) return;
    setIsSending(true);
    setSendSuccess(false);
    setError(null);
    try {
      await onSendToFigma(approvedItems);
      setSendSuccess(true);
      setTimeout(() => setSendSuccess(false), 4000);
    } catch {
      setError("Failed to send to Figma");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="border-t border-gray-200">
      <div className="px-4 py-3 space-y-2.5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-[12px] font-semibold text-gray-900 flex items-center gap-1.5">
            <span className="text-indigo-500">✦</span>
            Taste Critique
          </h3>
          {hasAIFeedback && (
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="text-[11px] text-gray-400 hover:text-indigo-600 disabled:opacity-50 transition-colors"
            >
              Regenerate
            </button>
          )}
        </div>

        {/* Generate button */}
        {!hasAIFeedback && (
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-[12px] font-medium text-gray-600 hover:bg-gray-50 hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-60 transition-all"
          >
            {isGenerating ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Analyzing design...
              </>
            ) : (
              <>
                <span>✦</span>
                Generate taste critique
              </>
            )}
          </button>
        )}

        {/* Regenerating state over existing items */}
        {hasAIFeedback && isGenerating && (
          <div className="flex items-center gap-2 text-[12px] text-indigo-500">
            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Regenerating critique...
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-[11px] text-red-500 bg-red-50 px-2.5 py-1.5 rounded-md">
            {error}
          </p>
        )}

        {/* Approved items summary */}
        {approvedItems.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              Approved for Figma ({approvedItems.length})
            </span>
            <div className="space-y-1">
              {approvedItems.map((item) => {
                const cfg = LEVEL_CONFIG[item.level];
                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-1.5 px-2 py-1.5 rounded-md bg-emerald-50/60 border border-emerald-100"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${cfg.dot}`} />
                    <p className="text-[11px] text-gray-700 leading-relaxed">
                      {item.figmaNote || item.text}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Send to Figma */}
            <button
              onClick={handleSend}
              disabled={isSending || sendSuccess}
              className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium transition-all ${
                sendSuccess
                  ? "bg-emerald-500 text-white border border-emerald-500"
                  : "bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
              }`}
            >
              {isSending ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Sending to Figma...
                </>
              ) : sendSuccess ? (
                <>✓ Sent to Figma</>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Send {approvedItems.length} item{approvedItems.length !== 1 ? "s" : ""} to Figma
                </>
              )}
            </button>
          </div>
        )}

        {/* AI items breakdown */}
        {hasAIFeedback && !isGenerating && (
          <div className="flex items-center gap-3 text-[11px] text-gray-400">
            <span>{allAIItems.filter((f) => f.approved === undefined).length} pending</span>
            <span>·</span>
            <span className="text-emerald-600">{approvedItems.length} approved</span>
            <span>·</span>
            <span>{allAIItems.filter((f) => f.approved === false).length} dismissed</span>
          </div>
        )}
      </div>
    </div>
  );
}
