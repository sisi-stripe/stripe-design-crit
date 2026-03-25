"use client";

import { useState, useCallback } from "react";
import { Feedback, LevelOfConcern } from "@/types";
import IterateSidebar from "./IterateSidebar";
import ImageCanvas from "./ImageCanvas";
import IterateFeedback from "./IterateFeedback";

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
          (item: { level: LevelOfConcern; text: string; rationale: string; figmaNote: string }) => ({
            id: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            sessionId: "",
            reviewerName: "Taste (AI)",
            level: item.level,
            text: item.text,
            rationale: item.rationale,
            figmaNote: item.figmaNote,
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

  const handleNewProject = useCallback(() => {
    const id = `proj-${Date.now()}`;
    const project: IterateProject = { id, title: `Project ${projects.length + 1}` };
    setProjects((prev) => [...prev, project]);
    setProjectFeedback((prev) => ({ ...prev, [id]: [] }));
    setActiveProjectId(id);
    setGenerateError(null);
  }, [projects.length]);

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

  return (
    <div className="flex h-screen overflow-hidden p-3 gap-3" style={{ background: "#F2F2F2" }}>
      <IterateSidebar
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={setActiveProjectId}
        onNewProject={handleNewProject}
        onBack={onBack}
      />

      <ImageCanvas
        imageDataUrl={activeProject?.imageDataUrl}
        projectTitle={activeProject?.title}
        onImageDrop={handleImageDrop}
        onImageClear={handleImageClear}
      />

      <IterateFeedback
        feedback={activeFeedback}
        hasImage={!!activeProject?.imageDataUrl}
        isGenerating={isGenerating}
        error={generateError}
        onRegenerate={handleRegenerate}
      />
    </div>
  );
}
