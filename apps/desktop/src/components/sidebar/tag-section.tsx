import { useCallback } from "react";
import { useTagIndex } from "@/hooks/use-tag-index";
import { SidebarSection } from "./sidebar-section";
import type { TagInfo } from "@/types/fs";

interface TagSectionProps {
  openFile: (path: string) => Promise<void>;
}

export function TagSection({ openFile }: TagSectionProps) {
  const { tags, taggedFiles, isLoading, activeTag, setActiveTag } = useTagIndex();

  const handleTagClick = useCallback(
    (tag: string) => {
      if (activeTag === tag) {
        setActiveTag(null);
      } else {
        setActiveTag(tag);
      }
    },
    [activeTag, setActiveTag],
  );

  if (tags.length === 0 && !isLoading) {
    return null;
  }

  return (
    <SidebarSection title="Tags">
      <div className="flex flex-col gap-px">
        {tags.map((tagInfo) => (
          <TagRow
            key={tagInfo.tag}
            tagInfo={tagInfo}
            isActive={activeTag === tagInfo.tag}
            onClick={handleTagClick}
          />
        ))}
        {activeTag && taggedFiles.length > 0 && (
          <div className="flex flex-col gap-px pl-5 pt-1">
            {taggedFiles.map((file) => (
              <button
                key={file.path}
                type="button"
                onClick={() => void openFile(file.path)}
                className="flex h-[28px] w-full items-center gap-1.5 overflow-hidden rounded-lg pl-1 pr-2 text-left text-[13px] leading-[1.15] text-[var(--fg-base)] hover:bg-[var(--surface-subtle)]"
              >
                <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap opacity-60">
                  {file.title ?? file.name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </SidebarSection>
  );
}

interface TagRowProps {
  tagInfo: TagInfo;
  isActive: boolean;
  onClick: (tag: string) => void;
}

function TagRow({ tagInfo, isActive, onClick }: TagRowProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(tagInfo.tag)}
      className={`group flex h-[28px] w-full items-center gap-1.5 rounded-lg pl-2 pr-2 text-left text-[13px] leading-[1.15] text-[var(--fg-base)] hover:bg-[var(--surface-subtle)] ${isActive ? "bg-[var(--surface-subtle)]" : ""}`}
    >
      <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
        <span className="text-[var(--accent)]">#</span>
        {tagInfo.tag}
      </span>
      <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--surface-input)] px-1.5 text-[11px] tabular-nums text-[var(--text-muted)]">
        {tagInfo.file_paths.length}
      </span>
    </button>
  );
}
