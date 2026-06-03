import { useCallback, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { EditorArea } from "./editor-area";
import { SidebarNavigator } from "./sidebar/sidebar-navigator";
import { ScrollFade } from "@/components/scroll-fade";
import { SurfaceCard } from "@/components/surface-card";
import { useActiveFilePath, useOpenCompactFile, useOpenFiles } from "@/hooks/use-tabs";
import { getFileName } from "@/lib/paths";

export function CompactFileLayout() {
  const activeFilePath = useActiveFilePath();
  const openFiles = useOpenFiles();
  const openCompactFile = useOpenCompactFile();
  const [isNavigatorOpen, setIsNavigatorOpen] = useState(false);
  const activeFile = activeFilePath ? openFiles.get(activeFilePath) : null;
  const title = activeFilePath ? activeFile?.title || getFileName(activeFilePath) : "Choose file";

  const handleOpenFile = useCallback(
    async (path: string) => {
      await openCompactFile(path);
    },
    [openCompactFile],
  );

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-transparent text-text-primary">
      <div
        data-tauri-drag-region
        className="absolute inset-x-0 top-0"
        style={{ height: "var(--chrome-drag-height)" }}
      />
      <div
        className="pointer-events-auto absolute left-0 top-0 z-50 flex items-center"
        style={{
          height: "calc(var(--chrome-control-height) + var(--chrome-control-padding) * 2)",
          padding: "var(--chrome-control-padding) 12px var(--chrome-control-padding) 92px",
        }}
      >
        <div className="relative w-[min(420px,calc(100vw-116px))]">
          <button
            type="button"
            aria-haspopup="tree"
            aria-expanded={isNavigatorOpen}
            aria-label="Open file navigator"
            onClick={() => setIsNavigatorOpen((open) => !open)}
            className="flex h-[var(--chrome-control-height)] w-full items-center gap-2 rounded-lg border border-transparent bg-[var(--surface-input)] px-3 text-left text-[13px] text-[var(--fg-base)] transition-colors hover:bg-[var(--surface-subtle-strong)]"
          >
            <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
              {title}
            </span>
            <span
              aria-hidden="true"
              className={`shrink-0 text-[var(--text-icon-muted)] transition-transform duration-150 ease-out ${
                isNavigatorOpen ? "rotate-180" : ""
              }`}
            >
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                size={16}
                color="currentColor"
                strokeWidth={2}
              />
            </span>
          </button>

          {isNavigatorOpen && (
            <SurfaceCard className="absolute left-0 top-[calc(100%+8px)] w-full overflow-hidden rounded-xl">
              <ScrollFade className="max-h-[min(70vh,560px)] overflow-y-auto px-2 py-3 scrollbar-none">
                <SidebarNavigator
                  openFile={handleOpenFile}
                  enableContextMenus={false}
                  onOpenFileComplete={() => setIsNavigatorOpen(false)}
                  className="flex flex-col gap-4"
                />
              </ScrollFade>
            </SurfaceCard>
          )}
        </div>
      </div>

      <div className="relative h-full min-w-0 bg-bg">
        <EditorArea />
      </div>
    </div>
  );
}
