"use client";

import { useState, useRef, useEffect } from "react";

interface IterateProject {
  id: string;
  title: string;
  imageDataUrl?: string;
}

interface IterateSidebarProps {
  projects: IterateProject[];
  activeProjectId: string | null;
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
  onRenameProject: (id: string, newTitle: string) => void;
  onBack: () => void;
}

export default function IterateSidebar({
  projects,
  activeProjectId,
  onSelectProject,
  onNewProject,
  onRenameProject,
  onBack,
}: IterateSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId) setTimeout(() => editInputRef.current?.focus(), 50);
  }, [editingId]);

  const startEditing = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditingTitle(currentTitle);
  };

  const commitEdit = () => {
    if (editingId && editingTitle.trim()) {
      onRenameProject(editingId, editingTitle.trim());
    }
    setEditingId(null);
  };
  return (
    <aside
      className="w-[340px] flex-shrink-0 flex flex-col h-full rounded-xl bg-white relative overflow-hidden"
      style={{ boxShadow: "0 4px 16px 0 rgba(0,0,0,0.04)" }}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onBack}
          className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
          title="Back to home"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span
          className="text-[15px] font-semibold text-gray-900"
          style={{ fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif' }}
        >
          Projects
        </span>
      </div>

      {/* Project list */}
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {projects.length === 0 ? (
          <div className="flex items-center justify-center h-full px-4 text-center">
            <p className="text-[12px] text-gray-400 leading-relaxed">
              No projects yet.<br />Create one to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {projects.map((project) => {
              const isActive = project.id === activeProjectId;
              return (
                <div
                  key={project.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectProject(project.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelectProject(project.id);
                    }
                  }}
                  className={`w-full text-left rounded-lg px-3 py-2.5 transition-all duration-150 cursor-pointer ${
                    isActive ? "bg-white" : "hover:bg-gray-50"
                  }`}
                  style={isActive ? { boxShadow: "0 1px 4px 0 rgba(0,0,0,0.06)" } : undefined}
                >
                  <div className="flex items-center gap-2.5">
                    {/* Thumbnail */}
                    <div className="w-8 h-8 rounded-md overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
                      {project.imageDataUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={project.imageDataUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <svg className="w-3.5 h-3.5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 20.25h18M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5z" />
                        </svg>
                      )}
                    </div>
                    {editingId === project.id ? (
                      <input
                        ref={editInputRef}
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitEdit();
                          if (e.key === "Escape") setEditingId(null);
                          e.stopPropagation();
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 min-w-0 text-[13px] font-medium text-gray-900 bg-white border border-indigo-400 rounded px-1.5 py-0.5 outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    ) : (
                      <span
                        className={`text-[13px] font-medium leading-tight truncate flex-1 min-w-0 ${isActive ? "text-gray-900" : "text-gray-700"}`}
                        onDoubleClick={(e) => startEditing(project.id, project.title, e)}
                        title="Double-click to rename"
                      >
                        {project.title}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Project button */}
      <div className="px-4 pb-4 flex-shrink-0">
        <button
          onClick={onNewProject}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-[12px] font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
          style={{ background: "#19273C" }}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Project
        </button>
      </div>
    </aside>
  );
}
