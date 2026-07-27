import {
  Decoration,
  type DecorationSet,
  EditorView,
  ViewPlugin,
  type ViewUpdate,
} from "@codemirror/view";
import { type Extension } from "@codemirror/state";
import { syntaxTree } from "@codemirror/language";

const tagMark = Decoration.mark({ class: "cm-tag" });

/** Regex that matches `#tag` tokens: `#` followed by one or more
 *  `[A-Za-z0-9_-]` characters. Avoids matching hex colors by checking the
 *  full word length (7, e.g. `#ff0000`). */
const TAG_RE = /(?:^|\s)(#([A-Za-z0-9_-]+))/g;

/** Build a decoration set of tag marks for the current view. Skips tags
 *  inside fenced code blocks, inline code, and frontmatter by checking the
 *  syntax tree. */
function buildTagDecorations(view: EditorView): DecorationSet {
  const tree = syntaxTree(view.state);
  const decos: { from: number; to: number }[] = [];

  // Collect no-go ranges from the syntax tree: code blocks, inline code,
  // frontmatter, and heading markers.
  const noGo = new Set<number>();

  tree.iterate({
    enter(node) {
      const name = node.name;
      // Fenced code, inline code, and frontmatter are no-go zones.
      if (
        name === "FencedCode" ||
        name === "InlineCode" ||
        name === "CommentBlock" ||
        name.startsWith("Frontmatter") ||
        name === "HeaderMark"
      ) {
        // Mark every position in this range as no-go.
        for (let i = node.from; i < node.to; i++) {
          noGo.add(i);
        }
      }
    },
  });

  const doc = view.state.doc.toString();

  TAG_RE.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = TAG_RE.exec(doc)) !== null) {
    const hashPos = match[0].indexOf("#");
    const tagStart = match.index + hashPos;
    const tagEnd = tagStart + match[1].length;

    // Check if the tag overlaps a no-go zone.
    let inNoGo = false;
    for (let i = tagStart; i < tagEnd; i++) {
      if (noGo.has(i)) {
        inNoGo = true;
        break;
      }
    }
    if (inNoGo) continue;

    // Skip hex colors: if the tag body is exactly 6 hex digits preceded by
    // `#` and the full match is 7 chars, it's a hex color.
    const body = match[2];
    if (body.length === 6 && /^[0-9a-fA-F]{6}$/.test(body)) continue;

    decos.push({ from: tagStart, to: tagEnd });
  }

  return Decoration.set(
    decos.map((d) => tagMark.range(d.from, d.to)),
    true,
  );
}

const tagPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = buildTagDecorations(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = buildTagDecorations(update.view);
      }
    }
  },
  { decorations: (v) => v.decorations },
);

/** Click handler for tag chips. When a `.cm-tag` element is clicked, set the
 *  active tag in the UI store so the sidebar shows the tagged files. */
function handleTagClick(event: MouseEvent, _view: EditorView) {
  const target = event.target as HTMLElement;
  if (!target.classList.contains("cm-tag")) return;

  event.preventDefault();
  event.stopPropagation();

  const tagText = target.textContent ?? "";
  const tag = tagText.replace(/^#/, "").toLowerCase();

  // Lazy import to avoid circular deps.
  void import("@/stores/ui-store").then(({ useUIStore }) => {
    useUIStore.getState().setActiveTag(tag);
  });
}

const tagClickHandler = EditorView.domEventHandlers({
  mousedown: (event, view) => {
    handleTagClick(event, view);
  },
});

export const tagDecorations: Extension = [tagPlugin, tagClickHandler];
