"use client";

import { useState, useCallback, useMemo } from "react";
import { sessions as initialSessions, feedbackBySession } from "@/data/mockData";
import { Feedback, LevelOfConcern, Session, getSessionStatus } from "@/types";
import Sidebar from "@/components/Sidebar";
import DesignPreview from "@/components/DesignPreview";
import FeedbackStream from "@/components/FeedbackStream";
import AISummary from "@/components/AISummary";
import ActionItems from "@/components/ActionItems";
import NewSessionModal from "@/components/NewSessionModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";

export default function Home() {
  const [allSessions, setAllSessions] = useState(initialSessions);
  const [activeCritId, setActiveCritId] = useState("mm");
  const [activeSessionId, setActiveSessionId] = useState(
    initialSessions.find((s) => s.critId === "mm")?.id || initialSessions[0].id
  );
  const [allFeedback, setAllFeedback] = useState(feedbackBySession);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);

  const filteredSessions = useMemo(
    () => allSessions.filter((s) => s.critId === activeCritId),
    [allSessions, activeCritId]
  );

  const activeSession = allSessions.find((s) => s.id === activeSessionId);
  const safeActiveSession = activeSession || filteredSessions[0];
  const feedback = safeActiveSession
    ? allFeedback[safeActiveSession.id] || []
    : [];
  const isClosed = safeActiveSession
    ? getSessionStatus(safeActiveSession.date) === "closed"
    : false;
  const deletingSession = deletingSessionId
    ? allSessions.find((s) => s.id === deletingSessionId)
    : null;

  const handleSwitchCrit = useCallback(
    (critId: string) => {
      setActiveCritId(critId);
      const firstInCrit = allSessions.find((s) => s.critId === critId);
      if (firstInCrit) setActiveSessionId(firstInCrit.id);
    },
    [allSessions]
  );

  const handleUpvote = useCallback(
    (feedbackId: string) => {
      const sid = safeActiveSession?.id;
      if (!sid) return;
      setAllFeedback((prev) => ({
        ...prev,
        [sid]: (prev[sid] || []).map((fb) =>
          fb.id === feedbackId ? { ...fb, upvotes: fb.upvotes + 1 } : fb
        ),
      }));
    },
    [safeActiveSession]
  );

  const handleCreateSession = useCallback(
    (session: Session) => {
      const withCrit = { ...session, critId: activeCritId };
      setAllSessions((prev) => [withCrit, ...prev]);
      setAllFeedback((prev) => ({ ...prev, [session.id]: [] }));
      setActiveSessionId(session.id);
    },
    [activeCritId]
  );

  const handleUpdateSession = useCallback((updated: Session) => {
    setAllSessions((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s))
    );
  }, []);

  const handleDeleteSession = useCallback(
    (id: string) => {
      setAllSessions((prev) => {
        const next = prev.filter((s) => s.id !== id);
        if (activeSessionId === id) {
          const nextInCrit = next.find((s) => s.critId === activeCritId);
          if (nextInCrit) setActiveSessionId(nextInCrit.id);
        }
        return next;
      });
      setAllFeedback((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setDeletingSessionId(null);
    },
    [activeSessionId, activeCritId]
  );

  const openNewModal = () => {
    setEditingSession(null);
    setIsModalOpen(true);
  };

  const openEditModal = (id: string) => {
    const session = allSessions.find((s) => s.id === id);
    if (session) {
      setEditingSession(session);
      setIsModalOpen(true);
    }
  };

  const handleSubmit = useCallback(
    (data: {
      reviewerName: string;
      level: LevelOfConcern;
      text: string;
      screenshotUrl?: string;
    }) => {
      const sid = safeActiveSession?.id;
      if (!sid) return;
      const newFeedback: Feedback = {
        id: `f-${Date.now()}`,
        sessionId: sid,
        reviewerName: data.reviewerName,
        level: data.level,
        text: data.text,
        timestamp: "Just now",
        upvotes: 0,
        screenshotUrl: data.screenshotUrl,
      };
      setAllFeedback((prev) => ({
        ...prev,
        [sid]: [newFeedback, ...(prev[sid] || [])],
      }));
    },
    [safeActiveSession]
  );

  if (!safeActiveSession) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-400 text-[14px]">
        No sessions found.
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden p-3 gap-3" style={{ background: "#F2F2F2" }}>
      <NewSessionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSession(null);
        }}
        onCreate={handleCreateSession}
        onUpdate={handleUpdateSession}
        existingSessions={filteredSessions}
        editingSession={editingSession}
      />

      <DeleteConfirmModal
        isOpen={!!deletingSessionId}
        sessionTitle={deletingSession?.title || ""}
        onConfirm={() =>
          deletingSessionId && handleDeleteSession(deletingSessionId)
        }
        onCancel={() => setDeletingSessionId(null)}
      />

      <Sidebar
        sessions={filteredSessions}
        activeSessionId={safeActiveSession.id}
        activeCritId={activeCritId}
        onSelectSession={setActiveSessionId}
        onSwitchCrit={handleSwitchCrit}
        onNewSession={openNewModal}
        onEditSession={openEditModal}
        onDeleteSession={(id) => setDeletingSessionId(id)}
      />

      <DesignPreview session={safeActiveSession} isClosed={isClosed} />

      <aside className="w-[400px] flex-shrink-0 rounded-xl bg-white flex flex-col h-full overflow-hidden" style={{ boxShadow: "0 4px 16px 0 rgba(0,0,0,0.04)" }}>
        <div className="flex-1 min-h-0">
          <FeedbackStream
            feedback={feedback}
            isClosed={isClosed}
            onUpvote={handleUpvote}
            onSubmit={handleSubmit}
            sessionTitle={safeActiveSession.title}
          />
        </div>
        <div className="flex-shrink-0 overflow-y-auto max-h-64">
          <AISummary feedback={feedback} />
          <ActionItems feedback={feedback} />
        </div>
      </aside>
    </div>
  );
}
