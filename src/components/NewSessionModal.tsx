"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  Session,
  getUpcomingThursdays,
  getRemainingMinutes,
  formatSessionDate,
  formatSessionTime,
  CRIT_TOTAL_MINUTES,
} from "@/types";

interface NewSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (session: Session) => void;
  onUpdate?: (session: Session) => void;
  existingSessions: Session[];
  editingSession?: Session | null;
}

const DURATION_OPTIONS = [10, 15, 20, 30];

const DEFAULT_FIGMA_URL =
  "https://www.figma.com/design/d2vDCfwecLVjdiGWzKote6/%F0%9F%92%A0--MM-Flow-System?node-id=1035-42597";

function toEmbedUrl(rawUrl: string): string {
  const url = rawUrl.trim();
  if (!url) return "";
  if (url.includes("/embed")) return url;
  if (url.includes("figma.com/")) {
    return `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(url)}`;
  }
  return url;
}

function reverseEmbedUrl(embedUrl: string): string {
  if (!embedUrl) return "";
  const match = embedUrl.match(/url=([^&]+)/);
  if (match) return decodeURIComponent(match[1]);
  return embedUrl;
}

export default function NewSessionModal({
  isOpen,
  onClose,
  onCreate,
  onUpdate,
  existingSessions,
  editingSession,
}: NewSessionModalProps) {
  const isEditMode = !!editingSession;

  const [title, setTitle] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [selectedDate, setSelectedDate] = useState("");
  const [figmaUrl, setFigmaUrl] = useState(DEFAULT_FIGMA_URL);
  const [prototypeUrl, setPrototypeUrl] = useState("");
  const [slidesUrl, setSlidesUrl] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);

  const thursdays = useMemo(() => getUpcomingThursdays(8), []);

  // When editing, exclude the current session's time from capacity calculations
  const sessionsForCapacity = useMemo(() => {
    if (!editingSession) return existingSessions;
    return existingSessions.filter((s) => s.id !== editingSession.id);
  }, [existingSessions, editingSession]);

  const thursdaySlots = useMemo(() => {
    return thursdays.map((dateIso) => {
      const remaining = getRemainingMinutes(sessionsForCapacity, dateIso);
      const isFull = remaining <= 0;
      const sessionsOnDate = sessionsForCapacity.filter(
        (s) => s.date === dateIso
      );
      return { dateIso, remaining, isFull, count: sessionsOnDate.length };
    });
  }, [thursdays, sessionsForCapacity]);

  const selectedRemaining = selectedDate
    ? getRemainingMinutes(existingSessions, selectedDate)
    : CRIT_TOTAL_MINUTES;

  const availableDurations = DURATION_OPTIONS.filter(
    (d) => d <= selectedRemaining
  );

  useEffect(() => {
    if (isOpen) {
      if (editingSession) {
        setTitle(editingSession.title);
        setDurationMinutes(editingSession.durationMinutes);
        setSelectedDate(editingSession.date);
        setFigmaUrl(reverseEmbedUrl(editingSession.figmaUrl));
        setPrototypeUrl(reverseEmbedUrl(editingSession.prototypeUrl));
        setSlidesUrl(
          editingSession.slidesUrl.includes("placeholder")
            ? ""
            : editingSession.slidesUrl
        );
      } else {
        setTitle("");
        setDurationMinutes(15);
        setFigmaUrl(DEFAULT_FIGMA_URL);
        setPrototypeUrl("");
        setSlidesUrl("");
        const firstAvailable = thursdaySlots.find((t) => !t.isFull);
        setSelectedDate(firstAvailable?.dateIso || "");
      }
      setTimeout(() => titleRef.current?.focus(), 100);
    }
  }, [isOpen, editingSession, thursdaySlots]);

  useEffect(() => {
    if (
      selectedDate &&
      !availableDurations.includes(durationMinutes) &&
      availableDurations.length > 0
    ) {
      setDurationMinutes(availableDurations[0]);
    }
  }, [selectedDate, availableDurations, durationMinutes]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const canSubmit =
    title.trim().length > 0 &&
    selectedDate &&
    durationMinutes <= selectedRemaining;

  const handleSubmit = () => {
    if (!canSubmit) return;

    const session: Session = {
      id: editingSession?.id || `s-${Date.now()}`,
      critId: editingSession?.critId || "",
      title: title.trim(),
      date: selectedDate,
      durationMinutes,
      figmaUrl: toEmbedUrl(figmaUrl),
      prototypeUrl: prototypeUrl.trim()
        ? toEmbedUrl(prototypeUrl)
        : toEmbedUrl(figmaUrl),
      slidesUrl: slidesUrl.trim() || "https://pitch.com/embed/placeholder",
    };

    if (isEditMode && onUpdate) {
      onUpdate(session);
    } else {
      onCreate(session);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 animate-slideUp max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-[15px] font-semibold text-gray-900">
              {isEditMode ? "Edit session" : "New design crit"}
            </h2>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Every Thursday {formatSessionTime()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
          {/* Title */}
          <div>
            <label className="block text-[12px] font-medium text-gray-700 mb-1.5">
              Session title
            </label>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="e.g. Checkout Flow v3"
              className="w-full h-9 px-3 rounded-lg border border-gray-200 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-shadow"
            />
          </div>

          {/* Thursday date picker */}
          <div>
            <label className="block text-[12px] font-medium text-gray-700 mb-1.5">
              Select a Thursday
            </label>
            <div className="grid grid-cols-2 gap-2">
              {thursdaySlots.map((slot) => {
                const isSelected = selectedDate === slot.dateIso;
                const capacityPct =
                  ((CRIT_TOTAL_MINUTES - slot.remaining) / CRIT_TOTAL_MINUTES) *
                  100;

                return (
                  <button
                    key={slot.dateIso}
                    onClick={() => !slot.isFull && setSelectedDate(slot.dateIso)}
                    disabled={slot.isFull}
                    className={`relative text-left px-3 py-2.5 rounded-lg border transition-all overflow-hidden ${
                      slot.isFull
                        ? "border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed"
                        : isSelected
                          ? "border-indigo-400 bg-indigo-50/50 ring-2 ring-indigo-500/20"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {/* Capacity bar */}
                    <div
                      className={`absolute bottom-0 left-0 h-0.5 transition-all ${
                        slot.isFull
                          ? "bg-gray-300"
                          : isSelected
                            ? "bg-indigo-400"
                            : "bg-gray-200"
                      }`}
                      style={{ width: `${capacityPct}%` }}
                    />

                    <span
                      className={`block text-[13px] font-medium ${
                        slot.isFull
                          ? "text-gray-400"
                          : isSelected
                            ? "text-indigo-700"
                            : "text-gray-800"
                      }`}
                    >
                      {formatSessionDate(slot.dateIso)}
                    </span>
                    <span
                      className={`block text-[11px] mt-0.5 ${
                        slot.isFull
                          ? "text-gray-400"
                          : isSelected
                            ? "text-indigo-500"
                            : "text-gray-400"
                      }`}
                    >
                      {slot.isFull ? (
                        <span className="flex items-center gap-1">
                          <svg
                            className="w-3 h-3"
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
                          Full ({slot.count}{" "}
                          {slot.count === 1 ? "session" : "sessions"})
                        </span>
                      ) : (
                        `${slot.remaining} min available · ${slot.count} booked`
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-[12px] font-medium text-gray-700 mb-1.5">
              Duration
              {selectedDate && (
                <span className="text-gray-400 font-normal ml-1">
                  ({selectedRemaining} min remaining)
                </span>
              )}
            </label>
            <div className="flex gap-2">
              {DURATION_OPTIONS.map((d) => {
                const isAvailable = d <= selectedRemaining;
                const isActive = durationMinutes === d;
                return (
                  <button
                    key={d}
                    onClick={() => isAvailable && setDurationMinutes(d)}
                    disabled={!isAvailable}
                    className={`flex-1 h-9 rounded-lg text-[13px] font-medium border transition-all ${
                      !isAvailable
                        ? "border-gray-100 text-gray-300 cursor-not-allowed"
                        : isActive
                          ? "border-indigo-400 bg-indigo-600 text-white shadow-sm"
                          : "border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {d} min
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* Figma URL */}
          <div>
            <label className="block text-[12px] font-medium text-gray-700 mb-1.5">
              Figma URL
            </label>
            <input
              type="url"
              value={figmaUrl}
              onChange={(e) => setFigmaUrl(e.target.value)}
              placeholder="https://www.figma.com/design/..."
              className="w-full h-9 px-3 rounded-lg border border-gray-200 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-shadow font-mono"
            />
            <p className="mt-1 text-[11px] text-gray-400">
              Paste any Figma file or prototype link
            </p>
          </div>

          {/* Prototype URL */}
          <div>
            <label className="block text-[12px] font-medium text-gray-700 mb-1.5">
              Prototype URL
              <span className="text-gray-400 font-normal ml-1">optional</span>
            </label>
            <input
              type="url"
              value={prototypeUrl}
              onChange={(e) => setPrototypeUrl(e.target.value)}
              placeholder="https://www.figma.com/proto/..."
              className="w-full h-9 px-3 rounded-lg border border-gray-200 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-shadow font-mono"
            />
          </div>

          {/* Slides URL */}
          <div>
            <label className="block text-[12px] font-medium text-gray-700 mb-1.5">
              Slides URL
              <span className="text-gray-400 font-normal ml-1">optional</span>
            </label>
            <input
              type="url"
              value={slidesUrl}
              onChange={(e) => setSlidesUrl(e.target.value)}
              placeholder="https://pitch.com/... or Google Slides link"
              className="w-full h-9 px-3 rounded-lg border border-gray-200 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-shadow font-mono"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-xl flex-shrink-0">
          <button
            onClick={onClose}
            className="px-3.5 py-2 rounded-lg text-[13px] font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="px-4 py-2 rounded-lg text-[13px] font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            {isEditMode ? "Save changes" : "Book slot"}
          </button>
        </div>
      </div>
    </div>
  );
}
