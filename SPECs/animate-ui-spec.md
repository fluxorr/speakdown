# Animate UI Spec

## Summary

Add snappy, tasteful motion to SpeakDown's desktop UI. The goal is not "add animation everywhere" — it's to give feedback where real latency exists, smooth the floating surfaces that currently hard-cut, and add a handful of deliberate micro-interactions. Everything stays fast, compositor-friendly, and respects reduced motion.

## Philosophy

SpeakDown sells itself as fast and lightweight. Motion must reinforce that pitch, not tax it.

- **Clarity over decoration** — every animation has a job: communicate state, show spatial relationship, or acknowledge action. If it doesn't do one of those, it doesn't go in.
- **Speed over spectacle** — frequency governs eligibility. Tab switching and file-tree expand happen dozens of times an hour; they get no animation. The command palette and voice overlays are deliberate, occasional actions; they get transitions.
- **Spatial continuity** — floating surfaces grow from what they're anchored to, never from a disconnected center.
- **Perceived responsiveness** — spend motion on async boundaries (directory reads, tag fetches) where there's real latency, not on instant local state changes.
- **Snappy, not editorial** — nothing takes longer than 260ms. Micro-interactions are 100-150ms. Exit animations are faster than entrances.

## Non-Goals

| Non-goal                                            | Why                                                                                                                                |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Animate tab switches (file↔file, file↔settings)     | Highest-frequency action; chrome is already pixel-identical across tabs — crossfade adds latency for a feeling that already exists |
| Stagger file-tree folder expand                     | Unbounded, non-virtualized list; used dozens of times a session                                                                    |
| Stagger new-tab-page recents                        | Opened many times a session; delight wears off, friction doesn't                                                                   |
| Animate word count                                  | Recomputes on every keystroke; discontinuous across file switches                                                                  |
| Spring/lag on drag ghost                            | Precision-critical; 1:1 tracking is already correct                                                                                |
| Left-border accent on sidebar row hover             | Not part of the visual language; background-fill hover already communicates state                                                  |
| Lift + shadow on inline tag chips                   | Inline body text shouldn't carry chrome-level elevation                                                                            |
| Smooth-scroll for heading-rail jumps                | Instant is correct for large jump distances — smooth blurs the target                                                              |
| Scroll-driven entrance reveals                      | Content must never hide behind animation                                                                                           |
| Page-level entrance choreography                    | Too editorial for a writing tool                                                                                                   |
| Bounce / elastic / overshoot anywhere               | Every curve should be decelerate-only                                                                                              |
| Confetti, celebrations, decorative loops            | Not this product                                                                                                                   |
| Native OS menus (context menus, workspace switcher) | Rendered outside web motion control                                                                                                |

## Implementation Approach

- **Primary:** `motion` (motion.dev, formerly Framer Motion). Install `npm i motion`, import from `motion/react`. Use `<motion.div>`, `AnimatePresence`, `whileHover`, `whileTap`, `layout`, `AnimatePresence`.
- **Tailwind:** Use Tailwind classes for the static styling, motion for the animated layer. For simple property transitions (color, opacity one-shots), plain Tailwind `transition-*` + `duration-*` is fine — not everything needs to be a motion component.
- **CSS-only:** Reserved for `@keyframes` (overlay fades, seekable animations), `prefers-reduced-motion` zeroing, and cases where motion's component wrapper would add unnecessary nesting for a pure-CSS affordance like a rotating chevron.

## Timing System

| Tier        | Duration  | Easing                          | Where                                         |
| ----------- | --------- | ------------------------------- | --------------------------------------------- |
| **Micro**   | 100-150ms | `ease-out` / spring stiff-light | Hover, press, toggle, close-reveal            |
| **Layout**  | 140ms     | `ease-out`                      | In-place geometry (width, position, height)   |
| **Surface** | 180ms     | `ease-out`                      | Floating surface enter/exit                   |
| **Morph**   | 260ms     | spring / `ease-out`             | Multi-element geometry change (button → card) |

Spring config (snappy, no overshoot): `{ type: "spring", stiffness: 400, damping: 30 }`. Micro tier uses this; Surface and Layout use plain `ease-out` for simplicity.

Ceiling: 260ms. Nothing takes longer. Floor: zero — if an interaction is meant to feel instant, the correct duration is no animation.

## Motion Tokens

Drop-in CSS additions to `App.css` alongside the existing `:root` block:

```css
:root {
  --motion-duration-micro: 120ms;
  --motion-duration-layout: 140ms;
  --motion-duration-surface: 180ms;
  --motion-duration-morph: 260ms;
  --motion-ease-standard: ease-out;
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --motion-duration-micro: 1ms;
    --motion-duration-layout: 1ms;
    --motion-duration-surface: 1ms;
    --motion-duration-morph: 1ms;
  }
}
```

Tailwind mapping: `duration-[120ms] ease-out`, etc. for one-off transitions that don't warrant a motion wrapper.

## Micro-interactions

### Sidebar row hover

Currently: background-color hover states with no `transition` property — instant color snap everywhere in `file-tree-node.tsx`, `tag-section.tsx`, `sidebar-section.tsx` (Show More button). `sidebar-toggle-button.tsx` already does better: `transition-colors` on base, `hover:transition-none` — hover-in is instant, hover-out eases.

Adopt that pattern everywhere: `transition-colors duration-120 ease-out hover:transition-none` on existing `hover:bg-[...]` classes.

Timing: Micro tier.
Don't trigger: on keyboard-driven `aria-selected`/active-row changes (instant is correct for keyboard nav).

### Inline tag chip hover (`.cm-tag`)

Currently: hard background-color snap with no transition.

Reject lift+shadow: this is `display: inline` text inside a paragraph — applying elevated-surface semantics to body text breaks the visual vocabulary. Chip already signals clickable via `cursor: pointer` and accent tint.

Add: transition on the existing background-color hover change, matching the task-checkbox timing (150ms) for consistency between the two accent-colored editor affordances.

### Folder chevron (file-tree) / tag row chevron (tag-section)

Already correct: `transition-transform` rotate on expand. Inconsistency: file-tree uses 200ms, tag-section uses 150ms. Align both to 150ms (Micro tier).

### Tab close button reveal (`editor-tabs.tsx`)

Currently: `opacity-0`/`translate-x-full` → `opacity-100`/`translate-x-0` hover classes but **no `transition` property** — hard cut in and out. Increases accidental-close risk when the "×" appears instantly where the cursor lands.

Add: `transition-[opacity,transform] duration-100 ease-out`. Compositor-friendly (opacity + transform only).

### Markdown task checkbox (`prosemark-theme.css`)

Already correct: `background-color`/`border-color` transition, 150ms. Keep as-is. Checkmark is a `background-image` swap and can't animate — it appears instantly when fill starts, which reads fine.

### Toggle switch (`settings-panel/setting-control.tsx`)

Already correct: knob `transition-transform duration-200`, track `transition-colors duration-200`. Keep as-is (or tighten to 150ms for consistency).

### Button press feedback

Currently: no `:active` styling found anywhere.

Scope to discrete control-shaped buttons only — toolbar icons (back/forward, new-tab, sidebar toggle, Cmd+F buttons), primary CTAs (Welcome screen "Add Folder"/"Open File"), picker trigger. Not on full-width rows, tab buttons, or list items.

Implementation: `whileTap={{ scale: 0.97 }}` via motion for wrapped buttons, or `active:scale-[0.97] transition-transform duration-75` via Tailwind for simple cases.

### Section rail tick — active state (`section-rail.tsx`)

Currently: `transition: transform 300ms ease-in, opacity 300ms ease-in`. Two issues: `ease-in` feels sluggish for a highlight meant to feel immediate; 300ms is slow for this tier.

Fix: `ease-out`, tighten to 180ms (surface-adjacent — this is the only continuous scroll-linked visual feedback tying position to structure).

## Layout Transitions

### Sidebar width + tab-strip left position

Already correct: both `width`/`left` transition at 140ms ease-out (`app-layout.tsx`), explicitly disabled during drag. Keep as-is.

### Sidebar section collapse (Pinned / Recents / Everything / Tags)

Currently: instant child removal via `{!isCollapsed && children}` — only the chevron animates.

Use `AnimatePresence` wrapping the collapsible content with `motion.div` animated on `height`, or the `grid-template-rows: 0fr / 1fr` CSS technique + opacity fade on inner content. Motion's `layout` prop may also handle this cleanly if the section is a single motion wrapper.

Timing: Layout tier, 140ms ease-out. Low-frequency action (once per session per section), so cost is negligible.

### File tree folder expand — reject stagger

Reject per-row stagger. This is the single highest-frequency interaction in the app, and the tree is an unbounded flat list — a folder can hold hundreds of entries. Stagger adds real animation cost for a surface used dozens of times per session. Leave instant.

### Tag section file expand (`tag-section.tsx`)

Unlike the file tree: genuinely async (`tauri.getTaggedFiles`) with a real "Loading…" interstitial, result sets are typically small.

Use `AnimatePresence` with a 150ms opacity crossfade between the "Loading…" row and the resolved file rows. Not a per-row stagger — just a single smooth swap across the async boundary.

### Frontmatter panel mount/unmount (`frontmatter-panel.tsx`)

Appears/disappears as the user types `---` — live, at the cursor. Needs to not fight typing.

Use `AnimatePresence` with height-only animation, no opacity fade (content shouldn't dissolve while being composed). Motion's `layout` prop on the wrapper may handle height smoothly.

Timing: Layout tier, 140ms.

### Cmd+F "Replace" row expand (`editor-search-overlay.tsx`)

Currently instant condition. Use `AnimatePresence` with height animation.

Timing: Micro tier, 120ms (small element).

## Enter / Exit Animations

### Command palette + Content search (`command-palette/index.tsx`, `content-search-palette.tsx`)

The single largest gap. Both use `cmdk`'s `CommandDialog` wrapping Radix's `Dialog`. Currently pop in/out with zero transition.

Implementation strategy:

1. Wrap `CommandDialog` content in `AnimatePresence`.
2. Overlay: `motion.div` fade `opacity: 0 → 1`.
3. Dialog panel: `motion.div` with `scale(0.95 → 1) + opacity` — reuses the centered-scale idiom from the mermaid fullscreen (the app's own precedent for anchor-less modals). No "scale from trigger" — the palette is keyboard-summoned from anywhere with no persistent trigger surface to scale from.

Timing: Surface tier, 180ms enter, 150ms exit.

Don't touch: `[cmdk-item][data-selected="true"]` — this highlight moves on every arrow-key press. Instant is correct for keyboard nav.

### Editor search overlay / Cmd+F (`editor-search-overlay.tsx`)

Built on `<SurfaceCard>`. Transform-origin should reflect its docked position (bottom-right). Use `translateY(+6px → 0) + opacity` — a small settle from the docked edge is spatially honest.

Generalize: add a `data-state` pattern to `SurfaceCard` itself (like `section-rail.css` already does) so Cmd+F, the rail popover, and future consumers inherit one treatment.

Timing: Surface tier, 180ms.

### Ephemeral status surfaces — voice mini-player, STT indicator, anchor-warning toast

Three separate components (`voice-tts-miniplayer.tsx`, `voice-stt-indicator.tsx`, `anchor-warning-banner.tsx`) each currently hard-cut independently, despite being the same conceptual thing: a floating, auto-dismissing status surface docked to a screen edge.

Consolidate with `AnimatePresence`:

- Entrance: `translateY` from the docked edge (+8px for bottom-docked mini-player/STT, -8px for top-docked anchor-warning toast) + `opacity`, 180ms ease-out.
- Exit: same reverse, faster — 150ms. Announce a little more gently than you leave; slow exit makes transient UI feel sticky.
- STT indicator cycles through mutually exclusive phases (`starting` → `listening` → `error`/`downloading`). Phase-to-phase swaps get a fast 120ms crossfade — short, because this communicates system status (including errors) the user needs immediately.

### Mermaid fullscreen

Already excellent: `scale(0.95→1) + opacity`, 180ms ease-out, `transitionend`-driven teardown with safety timeout. Keep exactly as-is.

### Welcome screen

Low priority, optional. A single `AnimatePresence` fade-in on mount if trivial to add. Not worth engineering time to perfect.

### New tab page — reject stagger

Opened via Cmd+T potentially dozens of times per session. Stagger on the recents list stops reading as delight within the first few uses and starts reading as friction. Leave fully static.

## Editor-specific

### Heading-rail scroll jump (`section-rail.tsx`)

Already correct: `behavior: "auto"` (instant), not `"smooth"`. Instant is right for large jumps — smooth blurs the target. Preserve explicitly.

### TTS karaoke word highlight (`.cm-tts-highlight`)

Currently instant per-word highlight. A very short (≤100ms) opacity fade-in per word could read as a pleasant "spotlight" synced to speech — but audio-sync fidelity is non-negotiable. Skip if it can't be verified to stay locked to the audio at faster playback speeds.

### Live dictation partial text (`.cm-dictation-overlay`)

Blinking caret already exists and is already wrapped in `@media (prefers-reduced-motion: reduce)` — the one piece of the app that has this today. The live partial-transcript text should **not** be animated — it's a real-time feed of in-progress recognition; animating its arrival would misrepresent it as more deliberate than "this is what's being heard right now."

## Delight (sparingly)

### Sidebar rename mode (`file-tree-node.tsx`)

Currently instant swap between `<button>` and `<div><input/></div>`. Low-frequency action, worth a small polish.

Add: 100ms opacity fade-in on the input row as it mounts (`motion.div` with `initial={{ opacity: 0 }} animate={{ opacity: 1 }}`). Don't animate the outgoing label — it's a text swap, not a surface.

### TTS play/pause icon swap (`voice-tts-miniplayer.tsx`)

Currently hard conditional swap between two SVGs. A 100ms crossfade between play/pause glyphs is standard in every media player and costs almost nothing.

## Files Expected To Change

### New dependency

- `apps/desktop/package.json` — add `motion` dependency

### CSS

- `apps/desktop/src/App.css` — add motion token custom properties to `:root`; add `@media (prefers-reduced-motion: reduce)` token zeroing; add `@keyframes` for overlay surfaces; add `transition-*` classes where simple Tailwind suffices

### Micro-interactions

- `apps/desktop/src/components/sidebar/file-tree-node.tsx` — sidebar row hover transition; chevron timing alignment
- `apps/desktop/src/components/sidebar/tag-section.tsx` — sidebar row hover transition; chevron timing alignment
- `apps/desktop/src/components/sidebar/sidebar-section.tsx` — Show More button hover transition
- `apps/desktop/src/components/editor-area/editor-tabs.tsx` — tab close button transition
- `apps/desktop/src/components/editor-area/prosemark-theme.css` — tag chip hover transition
- `apps/desktop/src/components/editor-area/section-rail.tsx` — tick active-state timing tighten
- `apps/desktop/src/components/settings-panel/setting-control.tsx` — toggle switch (optional timing tighten)

### Layout transitions

- `apps/desktop/src/components/sidebar/sidebar-section.tsx` — AnimatePresence + motion.div for collapsible content
- `apps/desktop/src/components/sidebar/tag-section.tsx` — AnimatePresence for file list crossfade
- `apps/desktop/src/components/editor-area/frontmatter-panel.tsx` — AnimatePresence for mount/unmount
- `apps/desktop/src/components/editor-area/editor-search-overlay.tsx` — AnimatePresence for replace row expand

### Enter / Exit

- `apps/desktop/src/components/command-palette/index.tsx` — AnimatePresence + motion.div for overlay + dialog
- `apps/desktop/src/components/content-search-palette.tsx` — same treatment
- `apps/desktop/src/components/editor-area/editor-search-overlay.tsx` — generalize SurfaceCard `data-state` pattern for Cmd+F
- `apps/desktop/src/components/voice-tts-miniplayer.tsx` — AnimatePresence with slide-up
- `apps/desktop/src/components/voice-stt-indicator.tsx` — AnimatePresence with slide-up; phase crossfade
- `apps/desktop/src/components/editor-area/anchor-warning-banner.tsx` — same treatment
- `apps/desktop/src/components/surface-card.tsx` — optional `data-state` pattern generalization

### Delight

- `apps/desktop/src/components/sidebar/file-tree-node.tsx` — rename mode fade-in
- `apps/desktop/src/components/voice-tts-miniplayer.tsx` — play/pause crossfade

## Acceptance Criteria

- Sidebar row hover transitions out smoothly (120ms eased-off) instead of snapping off.
- Tab close button fades in on row hover (100ms) instead of appearing instantly.
- Tag chip hover transitions background smoothly (150ms).
- Folder chevrons (file-tree + tag-section) both rotate at 150ms.
- Section rail tick active state transitions at 180ms ease-out instead of 300ms ease-in.
- Sidebar section collapse (Pinned, Recents, Everything, Tags) animates content height at 140ms.
- Tag section file list crossfades from "Loading…" to resolved rows at 150ms.
- Frontmatter panel animates height on mount/unmount at 140ms.
- Cmd+F replace row expands at 120ms.
- Command palette + content search dialog fade+scale in (180ms) and out (150ms) — the highlight on arrow-key-selected items stays instant.
- Voice mini-player, STT indicator, and anchor-warning toast all animate in (180ms slide+opacity from docked edge) and out (150ms).
- Mermaid fullscreen is unchanged and still works.
- Button press (toolbar icons, primary CTAs) shows `scale(0.97)` feedback.
- Rename mode input fades in at 100ms.
- TTS play/pause icon crossfades at 100ms.
- Tab switching, file-tree folder expand, and new-tab-page recents remain fully instant — no animation.
- Drag ghost tracks 1:1 with no smoothing — unchanged.
- All new transitions respect `prefers-reduced-motion: reduce` via the token zeroing in `:root`.
- All new transitions verified smooth at 60fps with 20+ file tabs open (keepAlive perf).
- Rapid repeated triggering (spam-toggle sidebar section, rapid ⌘K open/close) doesn't stack, restart badly, or leave orphaned DOM.
