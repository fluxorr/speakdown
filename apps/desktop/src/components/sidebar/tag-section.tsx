import { useCallback, useEffect, useState } from "react";
import * as tauri from "@/lib/tauri";
import { useTagIndex } from "@/hooks/use-tag-index";
import { useUIStore } from "@/stores/ui-store";
import { SidebarSection } from "./sidebar-section";
import type { TagInfo, TaggedFile } from "@/types/fs";

interface TagSectionProps {
  openFile: (path: string) => Promise<void>;
}

export function TagSection({ openFile }: TagSectionProps) {
  const { tags, isLoading } = useTagIndex();

  if (tags.length === 0 && !isLoading) {
    return null;
  }

  return (
    <SidebarSection title="Tags">
      <div className="flex flex-col gap-px">
        {tags.map((tagInfo) => (
          <TagRow key={tagInfo.tag} tagInfo={tagInfo} openFile={openFile} />
        ))}
      </div>
    </SidebarSection>
  );
}

interface TagRowProps {
  tagInfo: TagInfo;
  openFile: (path: string) => Promise<void>;
}

function TagRow({ tagInfo, openFile }: TagRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [files, setFiles] = useState<TaggedFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const activeTag = useUIStore((s) => s.activeTag);
  const setActiveTag = useUIStore((s) => s.setActiveTag);

  // Auto-expand when this tag is set active from the editor.
  useEffect(() => {
    if (activeTag === tagInfo.tag) {
      setIsExpanded(true);
    }
  }, [activeTag, tagInfo.tag]);

  // Fetch files when expanded; clear when collapsed.
  useEffect(() => {
    if (!isExpanded) {
      setFiles([]);
      return;
    }
    let cancelled = false;
    setIsLoadingFiles(true);
    void tauri.getTaggedFiles(tagInfo.tag).then(
      (result) => {
        if (cancelled) return;
        setFiles(result);
        setIsLoadingFiles(false);
      },
      (error: unknown) => {
        if (cancelled) return;
        console.error("Failed to fetch tagged files", error);
        setIsLoadingFiles(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [isExpanded, tagInfo.tag]);

  const handleClick = useCallback(() => {
    const next = !isExpanded;
    setIsExpanded(next);
    if (next) {
      setActiveTag(tagInfo.tag);
    } else {
      setActiveTag(null);
    }
  }, [isExpanded, tagInfo.tag, setActiveTag]);

  return (
    <div className="flex flex-col gap-px">
      <button
        type="button"
        onClick={handleClick}
        className={`group flex h-[28px] w-full items-center gap-1.5 rounded-lg pl-2 pr-2 text-left text-[13px] leading-[1.15] text-[var(--fg-base)] hover:bg-[var(--surface-subtle)] ${isExpanded ? "bg-[var(--surface-subtle)]" : ""}`}
      >
        <span
          aria-hidden="true"
          className={`flex h-3 w-3 shrink-0 items-center justify-center text-[var(--text-muted)] transition-transform duration-150 ease-out ${isExpanded ? "rotate-90" : ""}`}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M4.5 3.5L7.5 6L4.5 8.5"
              stroke="currentColor"
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-neutral-200/70">
          <span className="text-[var(--accent)]/80">#</span>
          {tagInfo.tag}
        </span>
        <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--surface-input)] px-1.5 text-[11px] tabular-nums text-[var(--text-muted)]">
          {tagInfo.file_paths.length}
        </span>
      </button>

      {isExpanded && (
        <div className="flex flex-col gap-px pl-5">
          {isLoadingFiles && (
            <div className="flex h-[28px] items-center pl-2 text-[13px] text-[var(--text-muted)] opacity-60">
              Loading…
            </div>
          )}
          {!isLoadingFiles && files.length === 0 && (
            <div className="flex h-[28px] items-center pl-2 text-[13px] text-[var(--text-muted)] opacity-60">
              No files
            </div>
          )}
          {files.map((file) => (
            <button
              key={file.path}
              type="button"
              onClick={() => void openFile(file.path)}
              className="flex h-[28px] w-full items-center gap-2 overflow-hidden rounded-lg pl-1 pr-2 text-left text-[13px] leading-[1.15] text-[var(--fg-base)] hover:bg-[var(--surface-subtle)]"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                className="shrink-0 opacity-40"
              >
                <path
                  d="M7 3H14L18 7V19C18 20.1046 17.1046 21 16 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3Z"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M13 3V7H18"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap opacity-70 group-hover:opacity-100">
                {file.title ?? file.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
