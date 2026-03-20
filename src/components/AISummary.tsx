"use client";

import { useState } from "react";
import { Feedback, LEVEL_CONFIG, LevelOfConcern } from "@/types";

interface AISummaryProps {
  feedback: Feedback[];
}

function groupByLevel(feedback: Feedback[]) {
  const groups: Partial<Record<LevelOfConcern, Feedback[]>> = {};
  feedback.forEach((fb) => {
    if (!groups[fb.level]) groups[fb.level] = [];
    groups[fb.level]!.push(fb);
  });
  return groups;
}

function generateThemes(feedback: Feedback[]): string[] {
  if (feedback.length === 0) return [];
  const themes: string[] = [];
  const blocking = feedback.filter((f) => f.level === "blocking");
  if (blocking.length > 0) {
    themes.push(
      `${blocking.length} blocking issue${blocking.length > 1 ? "s" : ""} need immediate attention`
    );
  }
  const hasAccessibility = feedback.some(
    (f) =>
      f.text.toLowerCase().includes("accessibility") ||
      f.text.toLowerCase().includes("contrast") ||
      f.text.toLowerCase().includes("wcag")
  );
  if (hasAccessibility) themes.push("Accessibility concerns flagged by reviewers");
  const hasUX = feedback.some(
    (f) =>
      f.text.toLowerCase().includes("user") ||
      f.text.toLowerCase().includes("conversion") ||
      f.text.toLowerCase().includes("usability")
  );
  if (hasUX) themes.push("User experience and conversion impact discussed");
  const kudos = feedback.filter((f) => f.level === "kudos");
  if (kudos.length > 0) {
    themes.push("Positive reception on visual design and layout");
  }
  const ideas = feedback.filter((f) => f.level === "idea");
  if (ideas.length > 0) {
    themes.push(`${ideas.length} enhancement suggestion${ideas.length > 1 ? "s" : ""} proposed`);
  }
  return themes;
}

export default function AISummary({ feedback }: AISummaryProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const groups = groupByLevel(feedback);
  const themes = generateThemes(feedback);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setIsVisible(true);
    }, 1500);
  };

  if (feedback.length === 0) return null;

  return (
    <div className="border-t border-gray-200">
      {!isVisible ? (
        <div className="px-4 py-3">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-[12px] font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-60 transition-all"
          >
            {isGenerating ? (
              <>
                <svg
                  className="w-3.5 h-3.5 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Analyzing feedback...
              </>
            ) : (
              <>
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
                Generate AI Summary
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="px-4 py-3 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[12px] font-semibold text-gray-900 flex items-center gap-1.5">
              <svg
                className="w-3.5 h-3.5 text-indigo-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              AI Summary
            </h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-[11px] text-gray-400 hover:text-gray-600"
            >
              Hide
            </button>
          </div>

          {/* Themes */}
          {themes.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Top Themes
              </span>
              {themes.map((theme, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-[12px] text-gray-600"
                >
                  <span className="text-indigo-400 mt-0.5">•</span>
                  {theme}
                </div>
              ))}
            </div>
          )}

          {/* Grouped breakdown */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              By Level
            </span>
            {(Object.entries(groups) as [LevelOfConcern, Feedback[]][]).map(
              ([level, items]) => {
                const cfg = LEVEL_CONFIG[level];
                return (
                  <div
                    key={level}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-md ${cfg.bg}`}
                  >
                    <span
                      className={`flex items-center gap-1.5 text-[12px] font-medium ${cfg.color}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                    <span className={`text-[12px] font-semibold ${cfg.color}`}>
                      {items.length}
                    </span>
                  </div>
                );
              }
            )}
          </div>
        </div>
      )}
    </div>
  );
}
