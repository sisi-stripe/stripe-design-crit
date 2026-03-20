"use client";

import { useState, useRef } from "react";
import { LevelOfConcern, LEVEL_CONFIG } from "@/types";

const LEVELS: LevelOfConcern[] = [
  "kudos",
  "question",
  "idea",
  "consider",
  "blocking",
];

interface FeedbackComposerProps {
  onSubmit: (data: {
    reviewerName: string;
    level: LevelOfConcern;
    text: string;
    screenshotUrl?: string;
  }) => void;
  disabled?: boolean;
}

export default function FeedbackComposer({
  onSubmit,
  disabled,
}: FeedbackComposerProps) {
  const [name, setName] = useState("");
  const [level, setLevel] = useState<LevelOfConcern>("question");
  const [text, setText] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isLevelOpen, setIsLevelOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const selectedConfig = LEVEL_CONFIG[level];

  const handleSubmit = () => {
    if (!name.trim() || !text.trim()) return;
    onSubmit({
      reviewerName: name.trim(),
      level,
      text: text.trim(),
      screenshotUrl: screenshot || undefined,
    });
    setText("");
    setScreenshot(null);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setScreenshot(reader.result as string);
    reader.readAsDataURL(file);
  };

  if (disabled) {
    return (
      <div className="border-t border-gray-200 bg-gray-50 px-4 py-4">
        <div className="flex items-center justify-center gap-2 text-[13px] text-gray-400">
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          This session is closed. Feedback is read-only.
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-200 bg-white px-4 py-3 space-y-2.5">
      {/* Top row: name + level */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="flex-1 h-8 px-2.5 rounded-md border border-gray-200 text-[12px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-shadow bg-white"
        />

        {/* Level dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsLevelOpen(!isLevelOpen)}
            className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border text-[12px] font-medium transition-colors ${selectedConfig.bg} ${selectedConfig.color} ${selectedConfig.border}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${selectedConfig.dot}`} />
            {selectedConfig.label}
            <svg
              className="w-3 h-3 ml-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {isLevelOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsLevelOpen(false)}
              />
              <div className="absolute bottom-full mb-1 right-0 z-20 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                {LEVELS.map((l) => {
                  const cfg = LEVEL_CONFIG[l];
                  return (
                    <button
                      key={l}
                      onClick={() => {
                        setLevel(l);
                        setIsLevelOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-[12px] font-medium hover:bg-gray-50 transition-colors ${
                        l === level ? cfg.color : "text-gray-700"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Textarea */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Share your feedback..."
        rows={2}
        className="w-full px-2.5 py-2 rounded-md border border-gray-200 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-shadow resize-none bg-white"
      />

      {/* Screenshot preview */}
      {screenshot && (
        <div className="relative w-fit">
          <img
            src={screenshot}
            alt="Attached"
            className="h-16 rounded-md border border-gray-200"
          />
          <button
            onClick={() => setScreenshot(null)}
            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-gray-900 text-white flex items-center justify-center"
          >
            <svg
              className="w-2.5 h-2.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Bottom row: attach + submit */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-1 text-[12px] text-gray-400 hover:text-gray-600 transition-colors"
        >
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
              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
            />
          </svg>
          Attach
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />

        <button
          onClick={handleSubmit}
          disabled={!name.trim() || !text.trim()}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-[12px] font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
        >
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
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
          Submit
        </button>
      </div>
    </div>
  );
}
