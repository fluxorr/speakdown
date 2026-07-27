import { useEffect, useState } from "react";
import * as tauri from "@/lib/tauri";
import { useUIStore } from "@/stores/ui-store";
import { useWorkspaceRoot } from "@/hooks/use-workspace";
import { useSidebarMetadataVersion } from "@/hooks/use-file-tree";
import type { TagInfo, TaggedFile } from "@/types/fs";

interface TagIndexState {
  tags: TagInfo[];
  taggedFiles: TaggedFile[];
  isLoading: boolean;
}

const EMPTY_STATE: TagIndexState = { tags: [], taggedFiles: [], isLoading: false };

/** Fetch and cache the workspace tag index. Returns the tag list and the
 *  tagged files for the currently active tag (if any). Re-fetches when the
 *  workspace root changes. */
export function useTagIndex(): TagIndexState & {
  activeTag: string | null;
  setActiveTag: (tag: string | null) => void;
} {
  const root = useWorkspaceRoot();
  const metadataVersion = useSidebarMetadataVersion();
  const activeTag = useUIStore((s) => s.activeTag);
  const setActiveTag = useUIStore((s) => s.setActiveTag);
  const [state, setState] = useState<TagIndexState>(EMPTY_STATE);

  useEffect(() => {
    if (!root) {
      setState(EMPTY_STATE);
      return;
    }

    let cancelled = false;

    setState((current) => ({ ...current, isLoading: true }));

    void (async () => {
      await tauri.reindexTags();
      if (cancelled) return;
      const tags = await tauri.listTags();
      if (cancelled) return;

      let taggedFiles: TaggedFile[] = [];
      if (activeTag) {
        taggedFiles = await tauri.getTaggedFiles(activeTag);
      }

      return { tags, taggedFiles };
    })().then(
      (result) => {
        if (cancelled || !result) return;
        setState({ tags: result.tags, taggedFiles: result.taggedFiles, isLoading: false });
      },
      (error: unknown) => {
        if (cancelled) return;
        console.error("Failed to index tags", error);
        setState(EMPTY_STATE);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [root, activeTag, metadataVersion]);

  return { ...state, activeTag, setActiveTag };
}
