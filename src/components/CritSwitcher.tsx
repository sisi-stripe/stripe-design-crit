"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  CRIT_CHANNELS,
  CRIT_CATEGORIES,
  formatSessionTime,
  getUpcomingThursdays,
} from "@/types";

interface CritSwitcherProps {
  activeCritId: string;
  onSwitch: (critId: string) => void;
}

function getNextUpcomingDate(): string {
  const thursdays = getUpcomingThursdays(1);
  if (thursdays.length > 0) {
    const d = new Date(thursdays[0] + "T12:00:00");
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
  return "";
}

export default function CritSwitcher({
  activeCritId,
  onSwitch,
}: CritSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const activeCrit = CRIT_CHANNELS.find((c) => c.id === activeCritId);
  const nextDate = useMemo(() => getNextUpcomingDate(), []);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  return (
    <div ref={ref} className="relative">
      {/* Header: logo + right-aligned content */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-start gap-2 hover:opacity-80 transition-opacity w-full text-left"
      >
        {/* Stripe logo */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className="flex-shrink-0 mt-[3px]"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M0 16L16 12.6069V0L0 3.43278V16Z"
            fill="#1A2C44"
          />
        </svg>

        {/* Title + date column */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[16px] font-semibold text-gray-900 leading-tight truncate">
              {activeCrit?.name || "Design Crit"}
            </span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              className={`flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M0.381282 3.38128C0.72299 3.03957 1.27701 3.03957 1.61872 3.38128L6 7.76256L10.3813 3.38128C10.723 3.03957 11.277 3.03957 11.6187 3.38128C11.9604 3.72299 11.9604 4.27701 11.6187 4.61872L6.61872 9.61872C6.27701 9.96043 5.72299 9.96043 5.38128 9.61872L0.381282 4.61872C0.0395728 4.27701 0.0395728 3.72299 0.381282 3.38128Z"
                fill="#474E5A"
              />
            </svg>
          </div>
          <p className="text-[14px] mt-0.5" style={{ color: "#7D8BA4" }}>
            {nextDate} · {formatSessionTime()}
          </p>
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 z-30 w-64 bg-white rounded-xl py-2 animate-fadeIn" style={{ boxShadow: "0 8px 32px 0 rgba(0,0,0,0.12)" }}>
          <div className="px-3 pb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#7D8BA4" }}>
              Switch crit
            </span>
          </div>

          {CRIT_CATEGORIES.map((cat) => {
            const channels = CRIT_CHANNELS.filter(
              (c) => c.category === cat.key
            );
            if (channels.length === 0) return null;
            return (
              <div key={cat.key} className="mb-0.5">
                <div className="px-3 pt-2.5 pb-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#C4CBD8" }}>
                    {cat.label}
                  </span>
                </div>
                {channels.map((channel) => {
                  const isActive = channel.id === activeCritId;
                  return (
                    <button
                      key={channel.id}
                      onClick={() => {
                        onSwitch(channel.id);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                        isActive
                          ? "bg-indigo-50 text-indigo-700"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          isActive ? "bg-indigo-500" : "bg-gray-300"
                        }`}
                      />
                      <span className="text-[13px] font-medium truncate">
                        {channel.name}
                      </span>
                      {isActive && (
                        <svg
                          className="w-3.5 h-3.5 ml-auto text-indigo-500 flex-shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
