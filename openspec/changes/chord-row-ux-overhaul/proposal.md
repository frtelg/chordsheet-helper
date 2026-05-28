## Why

Chord-row interactions feel buggy and counter-intuitive. UX audit of the editor surfaced five distinct problems:

1. **Wrong move semantics.** `moveDown` strips the chord off row N and writes it onto row N+1 (destroying the chord that was there). `moveUp` deletes the line directly above row N. Neither is a reversible "move chord" operation. The two arrows look like a paired control but execute unrelated destructive mutations.

2. **Non-standard selection model.** Clicking a row toggles a single contiguous range with non-OS-standard rules: no `shift+click`, no `cmd/ctrl+click`, no non-contiguous selection, no `Esc`, no `Cmd+A`. The selection checkbox is hidden until hover.

3. **Broken copy/paste.** The per-row "Copy chords" icon writes to the OS clipboard. The per-row "Paste" overwrites rows from the internal selection range. The two icons share an idiom but operate on disjoint buffers. The paste action has a known off-by-one bug in `pasteSelected` (drops one extra row at the splice boundary). There is also no way to copy a selection of chords and paste them onto a different set of rows.

4. **Poor discoverability and accessibility.** All actions live behind 1rem hover-only icons. No keyboard support, no drag-and-drop.

5. **Weak feedback.** Selected rows are indicated only by a tiny checkbox swap. No row-level highlight, no count badge, no contextual action bar, no inline undo.

Together these make the chord-row editor feel like a collection of half-finished primitives rather than a coherent editing surface.

## What Changes

### Mental model: chords are independent from lyrics

Lyrics are the fixed structure of the song. Chords sit above lyric lines and can be moved, copied, and pasted independently. **All chord-row operations manipulate chord values only — the lyric text is never moved or removed by a chord operation.**

- **Chord move up/down = chord-value swap.** `moveUp(N)` swaps the chord value of line N with the chord value of line N-1. `moveDown(N)` swaps with N+1. Both clamp at boundaries (no-op). Lyrics stay in place. For a multi-row selection (contiguous block), the block of chord values rotates one position in the move direction: the chord above the block (move up) or below the block (move down) comes into the block, and the displaced block-edge chord goes to the vacated position.

- **Copy = copy chord value strings.** The internal clipboard holds the chord strings extracted from the selected rows (not whole canonical lines).

- **Paste = overwrite chord values at target going downward.** `pasteChords(targetIdx)` replaces the chord values at rows `targetIdx`, `targetIdx+1`, `targetIdx+2`, … with the clipboard values. The lyrics at those rows are untouched. This is a replace operation, not an insert.

- **Cut = copy chords + clear them from source.** The source rows become chord-empty; no canonical lines are deleted.

- **Clear chords = set chord values to '' on selected rows.** No canonical lines are deleted.

### Selection model: OS-standard multi-select

- Click = select single row. Click same again = clear.
- `Shift+click` = extend range from anchor.
- `Cmd/Ctrl+click` = toggle individual (non-contiguous).
- `Esc` = clear. `Cmd/Ctrl+A` = select all.
- Selection state: `{ anchor?: number; indexes: number[] }`.

### Selection visibility and action bar

- Selected rows: tinted left border + subtle background.
- Sticky action bar at bottom when any rows selected: `Move ↑`, `Move ↓`, `Copy`, `Cut`, `Paste`, `Clear chords`, `Clear selection`.
- Selection pill shows row count.

### Per-row kebab menu

- Three-dot menu on row hover/focus replaces the old icon strip.
- Items: `Move up`, `Move down`, `Duplicate row`, `Clear chord`, `Copy chord text` (OS clipboard).

### Keyboard support

- ARIA listbox with roving tabindex.
- `ArrowUp/Down` = move focus. `Space` = toggle selection. `Shift+Arrow` = extend selection.
- `Cmd/Ctrl+C/X` = copy/cut chord values. `Cmd/Ctrl+V` = paste at focused row.
- `Cmd/Ctrl+A` = select all. `Esc` = clear selection.
- `Cmd/Ctrl+ArrowUp/Down` = move chord of focused row.

### Snackbar with undo

Destructive chord operations (cut, clear, paste) push a toast with `Undo` for 5 s.

## Capabilities

### New Capabilities

- `chord-row-interactions`: Contract for all per-row and bulk chord operations — selection model, chord move/copy/paste/clear semantics, kebab menu, keyboard support, and feedback affordances.

### Modified Capabilities

- `bidirectional-sync` (light touch): `moveUp`, `moveDown`, and `pasteSelected` change shape; the canonical-string contract itself is unchanged.

## Impact

- `src/redux/reducer/CanonicalReducer.ts` — rewrite `moveUp`/`moveDown` as chord-value swap (lyrics untouched); add `copySelected` (chord strings), `cutSelected` (copy + clear), `pasteChords(targetIdx)` (overwrite downward), `clearChords`; add `clipboard: string[]`; update `setSelected` payload to `{ index, mode }`.
- `src/lib/selectedrows/SelectedChordRows.ts` — replace contiguous-range state machine with `applySelection` pure function.
- `src/container/ChordSheetEditor/ChordSheetRow/index.tsx` — remove old icon strip; add kebab menu with chord-only actions; `role="option"`, `aria-selected`, click handler.
- `src/container/ChordSheetEditor/index.tsx` — `role="listbox"` wrapper; keyboard handlers; render `SelectionActionBar`.
- New `src/container/ChordSheetEditor/SelectionActionBar/index.tsx` — sticky bar with chord-only bulk actions.
- New `src/redux/reducer/ToastReducer.ts` + `src/components/Snackbar/index.tsx`.
- `src/app/globals.css` — selected row, kebab, action bar, snackbar styles.
- Unit tests: chord-swap semantics, selection model, chord-copy/paste/clear, undo.
- E2E tests: chord move, shift+click range, cmd+click toggle, keyboard shortcuts, paste overwrites, cut+undo.
- No changes to chord parsing, key detection, transpose, or the OnSong export view.
- No drag-and-drop reorder (whole-line DnD is out of scope for this change).
