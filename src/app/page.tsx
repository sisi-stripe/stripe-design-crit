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
import LandingScreen from "@/components/LandingScreen";
import IterateView from "@/components/IterateView";

type View = "landing" | "crit" | "iterate";

export default function Home() {
  const [view, setView] = useState<View>("landing");
  const [allSessions, setAllSessions] = useState(initialSessions);
  const [activeCritId, setActiveCritId] = useState("mm");
  const [activeSessionId, setActiveSessionId] = useState(
    initialSessions.find((s) => s.critId === "mm")?.id || initialSessions[0].id
  );
  const [allFeedback, setAllFeedback] = useState(feedbackBySession);

  const [selectedFeedbackId, setSelectedFeedbackId] = useState<string | null>(null);
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
      setSelectedFeedbackId(null);
      const firstInCrit = allSessions.find((s) => s.critId === critId);
      if (firstInCrit) setActiveSessionId(firstInCrit.id);
    },
    [allSessions]
  );

  const handleSelectSession = useCallback((id: string) => {
    setActiveSessionId(id);
    setSelectedFeedbackId(null);
  }, []);

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
        source: "human",
      };
      setAllFeedback((prev) => ({
        ...prev,
        [sid]: [newFeedback, ...(prev[sid] || [])],
      }));
    },
    [safeActiveSession]
  );

  // Add AI-generated feedback items to the current session
  const handleAddAIFeedback = useCallback(
    (items: Feedback[]) => {
      const sid = safeActiveSession?.id;
      if (!sid) return;
      setAllFeedback((prev) => ({
        ...prev,
        [sid]: [...items, ...(prev[sid] || []).filter((f) => f.source !== "ai")],
      }));
    },
    [safeActiveSession]
  );

  // Approve an AI feedback item (queue for Figma)
  const handleApprove = useCallback(
    (feedbackId: string) => {
      const sid = safeActiveSession?.id;
      if (!sid) return;
      setAllFeedback((prev) => ({
        ...prev,
        [sid]: (prev[sid] || []).map((fb) =>
          fb.id === feedbackId ? { ...fb, approved: true } : fb
        ),
      }));
    },
    [safeActiveSession]
  );

  // Dismiss an AI feedback item
  const handleDismiss = useCallback(
    (feedbackId: string) => {
      const sid = safeActiveSession?.id;
      if (!sid) return;
      setAllFeedback((prev) => ({
        ...prev,
        [sid]: (prev[sid] || []).map((fb) =>
          fb.id === feedbackId ? { ...fb, approved: false } : fb
        ),
      }));
    },
    [safeActiveSession]
  );

  // Handle user replying to an AI suggestion — calls Claude for refinement
  const handleRespond = useCallback(
    async (feedbackId: string, userReply: string) => {
      const sid = safeActiveSession?.id;
      if (!sid) return;

      // Find the feedback item to get its conversation history
      const item = (allFeedback[sid] || []).find((f) => f.id === feedbackId);
      if (!item) return;

      // Append user message and set refining state
      setAllFeedback((prev) => ({
        ...prev,
        [sid]: (prev[sid] || []).map((fb) =>
          fb.id === feedbackId
            ? {
                ...fb,
                isRefining: true,
                conversationThread: [
                  ...(fb.conversationThread || [{ role: "assistant" as const, text: fb.text }]),
                  { role: "user" as const, text: userReply },
                ],
              }
            : fb
        ),
      }));

      try {
        const conversationHistory = item.conversationThread || [
          { role: "assistant" as const, text: item.text },
        ];

        const res = await fetch("/api/taste", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationHistory,
            userReply,
          }),
        });

        const data = await res.json();
        const aiText = data.text || "Thanks for the context.";

        // Append AI refinement response
        setAllFeedback((prev) => ({
          ...prev,
          [sid]: (prev[sid] || []).map((fb) =>
            fb.id === feedbackId
              ? {
                  ...fb,
                  isRefining: false,
                  conversationThread: [
                    ...(fb.conversationThread || []),
                    { role: "assistant" as const, text: aiText },
                  ],
                }
              : fb
          ),
        }));
      } catch {
        setAllFeedback((prev) => ({
          ...prev,
          [sid]: (prev[sid] || []).map((fb) =>
            fb.id === feedbackId ? { ...fb, isRefining: false } : fb
          ),
        }));
      }
    },
    [safeActiveSession, allFeedback]
  );

  // Push approved items as Figma comments
  const handleSendToFigma = useCallback(
    async (approvedItems: Feedback[]) => {
      const figmaUrl = safeActiveSession?.figmaUrl;
      if (!figmaUrl) throw new Error("No Figma URL on this session");

      const res = await fetch("/api/figma-comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          figmaUrl,
          comments: approvedItems.map((item) => ({
            level: item.level,
            text: item.text,
            figmaNote: item.figmaNote,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send to Figma");
      }
    },
    [safeActiveSession]
  );

  const highlightNodeId = selectedFeedbackId
    ? (feedback.find((f) => f.id === selectedFeedbackId)?.figmaNodeId ?? null)
    : null;

  if (view === "landing") {
    return <LandingScreen onSelect={setView} />;
  }

  if (view === "iterate") {
    return <IterateView onBack={() => setView("landing")} />;
  }

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
        onSelectSession={handleSelectSession}
        onSwitchCrit={handleSwitchCrit}
        onNewSession={openNewModal}
        onEditSession={openEditModal}
        onDeleteSession={(id) => setDeletingSessionId(id)}
      />

      <DesignPreview
        session={safeActiveSession}
        isClosed={isClosed}
        highlightNodeId={highlightNodeId}
        onClearHighlight={() => setSelectedFeedbackId(null)}
      />

      <aside className="w-[400px] flex-shrink-0 rounded-xl bg-white flex flex-col h-full overflow-hidden" style={{ boxShadow: "0 4px 16px 0 rgba(0,0,0,0.04)" }}>
        <div className="flex-1 min-h-0">
          <FeedbackStream
            feedback={feedback}
            isClosed={isClosed}
            onUpvote={handleUpvote}
            onSubmit={handleSubmit}
            sessionTitle={safeActiveSession.title}
            selectedFeedbackId={selectedFeedbackId}
            onSelectFeedback={setSelectedFeedbackId}
          />
        </div>
        <div className="flex-shrink-0 overflow-y-auto max-h-72">
          <AISummary
            feedback={feedback}
            session={safeActiveSession}
            onAddAIFeedback={handleAddAIFeedback}
            onSendToFigma={handleSendToFigma}
          />
          <ActionItems feedback={feedback} />
        </div>
      </aside>
    </div>
  );
}
