import { useWorkspaceStore } from "@/stores/workspace-store";

export function useWorkspace() {
  const root = useWorkspaceStore((s) => s.root);
  const chromeMode = useWorkspaceStore((s) => s.chromeMode);
  const isIndexing = useWorkspaceStore((s) => s.isIndexing);
  const openWorkspace = useWorkspaceStore((s) => s.openWorkspace);
  const closeWorkspace = useWorkspaceStore((s) => s.closeWorkspace);
  const recentWorkspaces = useWorkspaceStore((s) => s.recentWorkspaces);
  const removeRecentWorkspace = useWorkspaceStore((s) => s.removeRecentWorkspace);
  return {
    root,
    chromeMode,
    isIndexing,
    openWorkspace,
    closeWorkspace,
    recentWorkspaces,
    removeRecentWorkspace,
  };
}

export function useWorkspaceChromeMode() {
  return useWorkspaceStore((s) => s.chromeMode);
}

export function useIsCompactFileMode() {
  return useWorkspaceStore((s) => s.chromeMode === "compact-file");
}

export function useIsStartupResolved() {
  return useWorkspaceStore((s) => s.isStartupResolved);
}

export function useWorkspaceRoot() {
  return useWorkspaceStore((s) => s.root);
}
