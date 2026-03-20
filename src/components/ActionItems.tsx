"use client";

import { useState, useMemo } from "react";
import { Feedback, LEVEL_CONFIG, ActionItem } from "@/types";

interface ActionItemsProps {
  feedback: Feedback[];
}

function generateActionItems(feedback: Feedback[]): ActionItem[] {
  return feedback
    .filter((fb) => fb.level === "blocking" || fb.level === "consider")
    .map((fb) => ({
      id: `ai-${fb.id}`,
      text: fb.text.length > 100 ? fb.text.slice(0, 100) + "..." : fb.text,
      level: fb.level,
      done: false,
    }));
}

export default function ActionItems({ feedback }: ActionItemsProps) {
  const initial = useMemo(() => generateActionItems(feedback), [feedback]);
  const [items, setItems] = useState<ActionItem[]>(initial);
  const [isOpen, setIsOpen] = useState(false);

  if (initial.length === 0) return null;

  const toggleDone = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, done: !item.done } : item
      )
    );
  };

  const doneCount = items.filter((i) => i.done).length;

  return (
    <div className="border-t border-gray-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <span className="text-[12px] font-semibold text-gray-900 flex items-center gap-1.5">
          <svg
            className="w-3.5 h-3.5 text-amber-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
          Action Items
          <span className="text-[10px] font-medium text-gray-400">
            {doneCount}/{items.length}
          </span>
        </span>
        <svg
          className={`w-3.5 h-3.5 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
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

      {isOpen && (
        <div className="px-4 pb-3 space-y-1">
          {items.map((item) => {
            const cfg = LEVEL_CONFIG[item.level];
            return (
              <button
                key={item.id}
                onClick={() => toggleDone(item.id)}
                className={`w-full flex items-start gap-2 px-2.5 py-2 rounded-md text-left transition-colors hover:bg-gray-50 ${
                  item.done ? "opacity-50" : ""
                }`}
              >
                <div
                  className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    item.done
                      ? "bg-indigo-600 border-indigo-600"
                      : "border-gray-300"
                  }`}
                >
                  {item.done && (
                    <svg
                      className="w-2.5 h-2.5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-[12px] leading-relaxed ${
                      item.done
                        ? "line-through text-gray-400"
                        : "text-gray-700"
                    }`}
                  >
                    {item.text}
                  </p>
                  <span
                    className={`inline-flex items-center gap-1 mt-1 text-[10px] font-medium ${cfg.color}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
