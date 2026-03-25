"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Feedback, LevelOfConcern } from "@/types";
import { EXAMPLE_PROJECT_ID, EXAMPLE_PROJECT_TITLE, exampleFeedback } from "@/data/exampleIterateFeedback";
import IterateSidebar from "./IterateSidebar";
import ImageCanvas from "./ImageCanvas";
import IterateFeedback from "./IterateFeedback";
import NewProjectModal from "./NewProjectModal";

interface IterateProject {
  id: string;
  title: string;
  imageDataUrl?: string;
  imageMediaType?: string;
}

interface IterateViewProps {
  onBack: () => void;
}

export default function IterateView({ onBack }: IterateViewProps) {
  const [projects, setProjects] = useState<IterateProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [projectFeedback, setProjectFeedback] = useState<Record<string, Feedback[]>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [hoveredBbox, setHoveredBbox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [feedbackWidth, setFeedbackWidth] = useState(320);
  const dragStateRef = useRef<{ startX: number; startWidth: number } | null>(null);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    dragStateRef.current = { startX: e.clientX, startWidth: feedbackWidth };

    const onMouseMove = (e: MouseEvent) => {
      if (!dragStateRef.current) return;
      const delta = dragStateRef.current.startX - e.clientX;
      const newWidth = Math.max(240, Math.min(600, dragStateRef.current.startWidth + delta));
      setFeedbackWidth(newWidth);
    };

    const onMouseUp = () => {
      dragStateRef.current = null;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, [feedbackWidth]);

  // Preload example project on mount
  useEffect(() => {
    fetch("/Dashboard.png")
      .then((r) => r.blob())
      .then((blob) => {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          setProjects([{ id: EXAMPLE_PROJECT_ID, title: EXAMPLE_PROJECT_TITLE, imageDataUrl: dataUrl, imageMediaType: "image/png" }]);
          setProjectFeedback({ [EXAMPLE_PROJECT_ID]: exampleFeedback });
          setActiveProjectId(EXAMPLE_PROJECT_ID);
        };
        reader.readAsDataURL(blob);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null;
  const activeFeedback = activeProjectId ? (projectFeedback[activeProjectId] ?? []) : [];

  const generateCritique = useCallback(
    async (imageDataUrl: string, projectTitle: string, projectId: string) => {
      setIsGenerating(true);
      setGenerateError(null);
      try {
        const res = await fetch("/api/taste", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: imageDataUrl,
            imageMediaType: imageDataUrl.split(";")[0].split(":")[1] || "image/png",
            sessionTitle: projectTitle,
          }),
        });

        const data = await res.json();
        if (!res.ok || data.error) {
          setGenerateError(data.error || "Failed to generate critique");
          return;
        }

        const newItems: Feedback[] = data.items.map(
          (item: { level: LevelOfConcern; text: string; rationale: string; figmaNote: string; bbox?: { x: number; y: number; width: number; height: number } }) => ({
            id: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            sessionId: "",
            reviewerName: "Taste (AI)",
            level: item.level,
            text: item.text,
            rationale: item.rationale,
            figmaNote: item.figmaNote,
            bbox: item.bbox,
            timestamp: "Just now",
            upvotes: 0,
            source: "ai" as const,
            approved: undefined,
          })
        );

        setProjectFeedback((prev) => ({ ...prev, [projectId]: newItems }));
      } catch {
        setGenerateError("Network error — check console");
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  const handleCreateProject = useCallback(async (
    name: string,
    imageDataUrl?: string,
    imageMediaType?: string,
    figmaUrl?: string,
  ) => {
    const id = `proj-${Date.now()}`;
    setProjects((prev) => [...prev, { id, title: name }]);
    setProjectFeedback((prev) => ({ ...prev, [id]: [] }));
    setActiveProjectId(id);
    setGenerateError(null);

    if (imageDataUrl) {
      setProjects((prev) => prev.map((p) => p.id === id ? { ...p, imageDataUrl, imageMediaType } : p));
      generateCritique(imageDataUrl, name, id);
    } else if (figmaUrl) {
      setIsGenerating(true);
      try {
        const res = await fetch("/api/figma-screenshot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ figmaUrl }),
        });
        const data = await res.json();
        if (!res.ok || data.error) {
          setGenerateError(data.error || "Failed to load Figma frame");
          setIsGenerating(false);
          return;
        }
        setProjects((prev) =>
          prev.map((p) => p.id === id ? { ...p, imageDataUrl: data.imageDataUrl, imageMediaType: "image/png" } : p)
        );
        generateCritique(data.imageDataUrl, name, id);
      } catch {
        setGenerateError("Network error — could not load Figma frame");
        setIsGenerating(false);
      }
    }
  }, [generateCritique]);

  const handleRenameProject = useCallback((id: string, newTitle: string) => {
    setProjects((prev) => prev.map((p) => p.id === id ? { ...p, title: newTitle } : p));
  }, []);

  const handleImageDrop = useCallback(
    (dataUrl: string, mediaType: string) => {
      let projectId = activeProjectId;
      let title = "Untitled Project";

      if (!projectId) {
        projectId = `proj-${Date.now()}`;
        title = "Project 1";
        setProjects((prev) => [...prev, { id: projectId!, title }]);
        setProjectFeedback((prev) => ({ ...prev, [projectId!]: [] }));
        setActiveProjectId(projectId);
      } else {
        title = projects.find((p) => p.id === projectId)?.title ?? "Untitled";
      }

      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? { ...p, imageDataUrl: dataUrl, imageMediaType: mediaType }
            : p
        )
      );
      setProjectFeedback((prev) => ({ ...prev, [projectId!]: [] }));
      generateCritique(dataUrl, title, projectId!);
    },
    [activeProjectId, projects, generateCritique]
  );

  const handleImageClear = useCallback(() => {
    if (!activeProjectId) return;
    setProjects((prev) =>
      prev.map((p) =>
        p.id === activeProjectId
          ? { ...p, imageDataUrl: undefined, imageMediaType: undefined }
          : p
      )
    );
    setProjectFeedback((prev) => ({ ...prev, [activeProjectId]: [] }));
    setGenerateError(null);
  }, [activeProjectId]);

  const handleRegenerate = useCallback(() => {
    if (!activeProject?.imageDataUrl) return;
    generateCritique(activeProject.imageDataUrl, activeProject.title, activeProject.id);
  }, [activeProject, generateCritique]);

  const handleResolve = useCallback((id: string) => {
    if (!activeProjectId) return;
    setProjectFeedback((prev) => ({
      ...prev,
      [activeProjectId]: (prev[activeProjectId] ?? []).map((f) =>
        f.id === id ? { ...f, approved: true } : f
      ),
    }));
  }, [activeProjectId]);

  const handleIterate = useCallback((_id: string) => {
    // Detail view is handled inside IterateFeedback
  }, []);

  const handleRefineFeedback = useCallback((id: string, newRationale: string, thread: { role: "user" | "assistant"; text: string }[]) => {
    if (!activeProjectId) return;
    setProjectFeedback((prev) => ({
      ...prev,
      [activeProjectId]: (prev[activeProjectId] ?? []).map((f) =>
        f.id === id ? { ...f, rationale: newRationale, conversationThread: thread } : f
      ),
    }));
  }, [activeProjectId]);

  return (
    <div className="flex h-screen overflow-hidden p-3 gap-3 select-none" style={{ background: "#F2F2F2" }}>
      <IterateSidebar
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={setActiveProjectId}
        onNewProject={() => setShowNewProjectModal(true)}
        onRenameProject={handleRenameProject}
        onBack={onBack}
      />

      <NewProjectModal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        onCreate={(name, imageDataUrl, imageMediaType, figmaUrl) =>
          handleCreateProject(name, imageDataUrl, imageMediaType, figmaUrl)
        }
      />

      <div className="flex-1 min-w-0 h-full">
        <ImageCanvas
          imageDataUrl={activeProject?.imageDataUrl}
          projectTitle={activeProject?.title}
          onImageDrop={handleImageDrop}
          onImageClear={handleImageClear}
          highlightBbox={hoveredBbox}
        />
      </div>

      {/* Drag handle */}
      <div
        onMouseDown={handleDragStart}
        className="flex-shrink-0 flex items-center justify-center cursor-col-resize self-stretch group"
        style={{ width: "12px" }}
      >
        <div className="w-[3px] h-8 rounded-full bg-gray-200 group-hover:bg-indigo-400 group-active:bg-indigo-500 transition-colors" />
      </div>

      <IterateFeedback
        feedback={activeFeedback}
        hasImage={!!activeProject?.imageDataUrl}
        isGenerating={isGenerating}
        error={generateError}
        onRegenerate={handleRegenerate}
        onHoverFeedback={setHoveredBbox}
        onResolve={handleResolve}
        onIterate={handleIterate}
        onRefineFeedback={handleRefineFeedback}
        width={feedbackWidth}
      />
    </div>
  );
}
