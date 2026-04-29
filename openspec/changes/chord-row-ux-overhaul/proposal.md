## Why

Chord-row interactions feel buggy and counter-intuitive. UX audit of the editor surfaced five distinct problems:

1. **Asymmetric move semantics.** `moveDown` strips the chord off row N and pastes it onto row N+1 (a chord migration). `moveUp` deletes the line directly above row N (a line removal). Neither matches the user's mental model of "move this row up/down". The two arrows look like a paired control but execute completely different operations on completely different lines.

2. **Non-standard selection model.** Clicking a row toggles a single contiguous range with non-OS-standard rules: clicking row 5 after selecting row 1 produces range 1–5; clicking row 1 again produces range 2–5; clicking row 3 inside range 1–5 collapses to 1–2. There is no `shift+click`, no `cmd/ctrl+click`, no non-contiguous selection, no `Esc` to clear, no `Cmd+A` to select all. The selection checkbox is hidden until hover, so on long sheets the user cannot see what is selected without sweeping the mouse over every row.

3. **Split-brain copy/paste.** The per-row "Copy chords" icon writes the chord text to the OS clipboard. The per-row "Paste" icon pastes the *internal* selection range and overwrites rows starting at the target. The two icons share an idiom but operate on disjoint buffers, and the paste action overwrites rows destructively (with a likely off-by-one bug in `pasteSelected` — see Impact).

4. **Poor discoverability and accessibility.** All actions live behind 1rem icons revealed on hover, with `title` attributes as the only label. The paste icon is hover-gated, so touch users cannot reach it at all. There is no keyboard support (no arrow-key focus, no `Space` to toggle selection, no shortcut for copy/paste/move). Row reorder by drag-and-drop — the de facto standard for list reordering — does not exist.

5. **Weak feedback.** Selected rows are indicated only by a tiny checkbox icon swap. There is no row-level highlight, no count of selected rows, no contextual action bar. Move and paste mutate the document with no animation, no preview of the target, and no inline undo affordance — `undo` lives in the page-level `HelpersBar` only.

Together these problems make the chord-row editor feel like a collection of half-finished primitives rather than a coherent editing surface.

## What Changes

- **Redefine move semantics as symmetric row swap.** `moveUp(N)` swaps row N with row N-1. `moveDown(N)` swaps row N with row N+1. Both clamp at the boundaries (no-op, no history push). The legacy "shift chord onto next lyric line" operation is removed; chord-only lines and lyric lines participate in the same swap.
- **Replace the selection model with OS-standard mouse semantics.** Click = select single. `Shift+click` = extend range from anchor. `Cmd/Ctrl+click` = toggle individual (allowing non-contiguous selection). `Esc` = clear. `Cmd/Ctrl+A` (when an editor row has focus) = select all rows. The selection state becomes `{ anchor: number; indexes: Set<number> }` instead of `{ from, to }`.
- **Make the selection state visible.** Selected rows render with a tinted left border and a subtle background highlight. A small "N rows selected" pill always appears in the top-right corner of the editor when selection is non-empty, with `Clear` and the contextual actions inline.
- **Add a contextual action bar for bulk operations.** When at least one row is selected, a sticky bar at the bottom of the editor surfaces: `Copy`, `Cut`, `Paste after`, `Move up`, `Move down`, `Delete`, `Clear`. This bar is the single source of bulk-mutation actions. Per-row icons are removed for these operations.
- **Unify clipboard semantics.** A single internal "row clipboard" holds the most recently copied or cut row range. `Copy` and `Cut` write to it; `Paste after target` reads from it and inserts after the target row. The OS clipboard is no longer used for in-app copy/paste of rows. (The OS-clipboard "Copy chords" affordance moves into the per-row kebab menu under the explicit name "Copy chord text".)
- **Replace the per-row icon strip with a drag handle and a kebab menu.** Hovering a row reveals a drag handle on the left and a three-dot menu on the right. The kebab menu contains: `Move up`, `Move down`, `Duplicate`, `Delete`, `Copy chord text` (OS clipboard). Drag-and-drop reorders the row.
- **Add full keyboard support.** Each row is a `role="option"` inside a `role="listbox"`. `ArrowUp/ArrowDown` moves focus. `Space` toggles selection of the focused row. `Shift+ArrowUp/Down` extends selection. `Cmd/Ctrl+ArrowUp/Down` moves the focused row up/down. `Cmd/Ctrl+C`, `Cmd/Ctrl+X`, `Cmd/Ctrl+V` operate on the row clipboard when no text input has focus. `Delete/Backspace` deletes selected rows.
- **Show inline undo for destructive operations.** `Cut`, `Delete`, `Paste after`, and bulk `Move` show a snackbar with an `Undo` button for 5 seconds. Single-row moves do not snackbar.
- **Fix the off-by-one in `pasteSelected`.** Current code slices the tail at `targetIdx + selectedLines.length + 1`, dropping one extra row. Replace with a non-destructive insert-after model, where pasted rows are spliced in at `targetIdx + 1` without overwriting.

## Capabilities

### New Capabilities

- `chord-row-interactions`: The contract for all per-row and bulk-row interactions in the chord-sheet editor — selection model, move semantics, clipboard semantics, kebab menu, drag-and-drop, keyboard support, and feedback affordances.

### Modified Capabilities

- `bidirectional-sync` (light touch): The reducer actions `moveUp`, `moveDown`, and `pasteSelected` change shape; the canonical-string contract itself is unchanged.

## Impact

- `src/redux/reducer/CanonicalReducer.ts` — rewrite `moveUp`, `moveDown` as symmetric row swap; rewrite `pasteSelected` as non-destructive insert-after; add `cutSelected`, `copySelected`, `deleteSelected`, `duplicateRow`, `clipboard: string[]` slice field; widen `selected` from `{ from?, to? }` to `{ anchor?: number; indexes: number[] }`; update `setSelected` to take a `{ index, mode: 'single'|'range'|'toggle' }` payload. Update `ChordSheetReducer.spec.ts` accordingly.
- `src/lib/selectedrows/SelectedChordRows.ts` — replace contiguous-range state machine with `Set<number>`-backed model. Keep the file as the home of the selection-mode reducer logic.
- `src/container/ChordSheetEditor/ChordSheetRow/index.tsx` — remove move/copy/select/paste icons; add drag handle, kebab menu, `role="option"`, `aria-selected`, click handler that distinguishes single / shift / cmd modes, focus management. Selected-state CSS for left border + background tint.
- `src/container/ChordSheetEditor/index.tsx` — wrap rows in `role="listbox"`; add `ArrowUp/Down`, `Space`, `Shift+Arrow`, `Cmd/Ctrl+Arrow`, `Cmd/Ctrl+C/X/V`, `Esc`, `Cmd/Ctrl+A`, `Delete` handlers at the form level. Render the contextual action bar when selection non-empty.
- New `src/container/ChordSheetEditor/SelectionActionBar/index.tsx` — sticky bar with the bulk-mutation buttons.
- New `src/container/ChordSheetEditor/Snackbar/index.tsx` (or a global toast slice) — host the "Undo" affordance for destructive ops.
- `src/container/ChordSheetEditor/HelpersBar/index.tsx` — drop the now-redundant "Clear selected" icon (moves into the action bar). Keep `Undo` and `Enable edit lyrics`.
- `src/app/globals.css` — add styles for selected row, drag handle, kebab menu, action bar, snackbar.
- New unit tests for: symmetric move swap (boundaries, single-row sheet, with chord-only lines), `Set`-based selection state machine (single / range / toggle / clear / select-all), insert-after paste semantics, cut/delete with undo, keyboard handlers.
- New E2E tests for: drag-and-drop reorder, shift+click range, cmd+click toggle, keyboard arrow + space + shift selection, paste-after preserves untouched rows, delete + undo via snackbar.
- E2E `e2e/tests/row-operations.spec.ts` is rewritten to match the new semantics. The current "move down shifts chord" assertion no longer holds — it becomes "move down swaps the row".
- No changes to chord parsing, key detection, transpose, or the OnSong export view.
