import { create } from "zustand";

export type CommandPaletteIntent = "search" | "create-file";

interface UIState {
  isCommandPaletteOpen: boolean;
  commandPaletteIntent: CommandPaletteIntent;
  commandPaletteSearch: string;

  isContentSearchOpen: boolean;

  /** When set, the sidebar Tags section highlights this tag and shows its
   *  files. Set by clicking a tag chip in the editor or a tag in the sidebar.
   *  Cleared when the user navigates away or closes the tag view. */
  activeTag: string | null;

  openCommandPalette: (intent?: CommandPaletteIntent) => void;
  closeCommandPalette: () => void;
  setCommandPaletteSearch: (search: string) => void;

  openContentSearch: () => void;
  closeContentSearch: () => void;

  setActiveTag: (tag: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isCommandPaletteOpen: false,
  commandPaletteIntent: "search",
  commandPaletteSearch: "",

  isContentSearchOpen: false,

  activeTag: null,

  openCommandPalette: (intent = "search") =>
    set({ isCommandPaletteOpen: true, commandPaletteIntent: intent, commandPaletteSearch: "" }),
  closeCommandPalette: () =>
    set({
      isCommandPaletteOpen: false,
      commandPaletteIntent: "search",
      commandPaletteSearch: "",
    }),
  setCommandPaletteSearch: (search: string) => set({ commandPaletteSearch: search }),

  openContentSearch: () => set({ isContentSearchOpen: true, isCommandPaletteOpen: false }),
  closeContentSearch: () => set({ isContentSearchOpen: false }),

  setActiveTag: (tag: string | null) => set({ activeTag: tag }),
}));
