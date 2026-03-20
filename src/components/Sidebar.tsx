"use client";

import { useMemo } from "react";
import {
  Session,
  SessionStatus,
  getSessionStatus,
  formatSessionDate,
} from "@/types";
import SessionMenu from "./SessionMenu";
import CritSwitcher from "./CritSwitcher";

const STATUS_STYLES: Record<
  SessionStatus,
  {
    label: string;
    dotColor: string;
    textColor: string;
    bgColor: string;
    dotClass?: string;
  }
> = {
  live: {
    label: "Live",
    dotColor: "#10b981",
    textColor: "#047857",
    bgColor: "#ecfdf5",
    dotClass: "animate-pulse",
  },
  upcoming: {
    label: "Upcoming",
    dotColor: "#533AFD",
    textColor: "#533AFD",
    bgColor: "#EFECFC",
  },
  closed: {
    label: "Closed",
    dotColor: "#667691",
    textColor: "#667691",
    bgColor: "#ECF1F6",
  },
};

interface SidebarProps {
  sessions: Session[];
  activeSessionId: string;
  activeCritId: string;
  onSelectSession: (id: string) => void;
  onSwitchCrit: (critId: string) => void;
  onNewSession: () => void;
  onEditSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
}

export default function Sidebar({
  sessions,
  activeSessionId,
  activeCritId,
  onSelectSession,
  onSwitchCrit,
  onNewSession,
  onEditSession,
  onDeleteSession,
}: SidebarProps) {
  return (
    <aside
      className="w-[340px] flex-shrink-0 rounded-xl flex flex-col h-full overflow-hidden"
      style={{
        background: "#F9F9F9",
        boxShadow: "0 4px 16px 0 rgba(0,0,0,0.04)",
      }}
    >
      <div className="p-4 pb-3">
        <CritSwitcher activeCritId={activeCritId} onSwitch={onSwitchCrit} />
      </div>

      <nav className="flex-1 overflow-y-auto px-4 pb-4 pt-3">
        <SessionGroup
          label="Live"
          sessions={sessions}
          statusFilter="live"
          sortAsc
          activeSessionId={activeSessionId}
          onSelectSession={onSelectSession}
          onEditSession={onEditSession}
          onDeleteSession={onDeleteSession}
        />
        <SessionGroup
          label="Upcoming"
          sessions={sessions}
          statusFilter="upcoming"
          sortAsc
          activeSessionId={activeSessionId}
          onSelectSession={onSelectSession}
          onEditSession={onEditSession}
          onDeleteSession={onDeleteSession}
        />
        <SessionGroup
          label="Closed"
          sessions={sessions}
          statusFilter="closed"
          sortAsc={false}
          activeSessionId={activeSessionId}
          onSelectSession={onSelectSession}
          onEditSession={onEditSession}
          onDeleteSession={onDeleteSession}
        />
      </nav>

      <div className="px-4 pb-4">
        <button
          onClick={onNewSession}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-[13px] font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
          style={{ background: "#1A2C44" }}
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Session
        </button>
      </div>
    </aside>
  );
}

function SessionGroup({
  label,
  sessions,
  statusFilter,
  sortAsc,
  activeSessionId,
  onSelectSession,
  onEditSession,
  onDeleteSession,
}: {
  label: string;
  sessions: Session[];
  statusFilter: SessionStatus;
  sortAsc: boolean;
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onEditSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
}) {
  const filtered = useMemo(() => {
    const items = sessions.filter(
      (s) => getSessionStatus(s.date) === statusFilter
    );
    return items.sort((a, b) => {
      const diff = a.date.localeCompare(b.date);
      return sortAsc ? diff : -diff;
    });
  }, [sessions, statusFilter, sortAsc]);

  if (filtered.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="px-1 mb-1.5">
        <span
          className="text-[12px] font-medium tracking-wide"
          style={{ color: "#7D8BA4" }}
        >
          {label}
        </span>
      </div>
      <div className="space-y-1">
        {filtered.map((session) => {
          const isActive = session.id === activeSessionId;
          const computedStatus = getSessionStatus(session.date);
          const style = STATUS_STYLES[computedStatus];
          return (
            <button
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={`w-full text-left rounded-lg px-3 py-2.5 transition-all duration-150 group ${
                isActive
                  ? "bg-white"
                  : "hover:bg-white/60"
              }`}
              style={
                isActive
                  ? { boxShadow: "0 1px 4px 0 rgba(0,0,0,0.06)" }
                  : undefined
              }
            >
              <div className="flex items-start justify-between gap-1.5">
                <span
                  className={`text-[14px] font-medium leading-tight flex-1 min-w-0 ${
                    isActive ? "text-gray-900" : "text-gray-700"
                  }`}
                >
                  {session.title}
                </span>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <SessionMenu
                    onEdit={() => onEditSession(session.id)}
                    onDelete={() => onDeleteSession(session.id)}
                  />
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-medium whitespace-nowrap ${style.dotClass || ""}`}
                    style={{
                      background: style.bgColor,
                      color: style.textColor,
                      padding: "4px 8px",
                      borderRadius: "4px",
                    }}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${style.dotClass || ""}`}
                      style={{ background: style.dotColor }}
                    />
                    {style.label}
                  </span>
                </div>
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-[12px]" style={{ color: "#7D8BA4" }}>
                <span>{formatSessionDate(session.date)}</span>
                <span style={{ color: "#C4CBD8" }}>&middot;</span>
                <span>{session.durationMinutes} mins</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
