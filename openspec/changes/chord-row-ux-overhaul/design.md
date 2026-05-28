## Context

The chord-sheet editor renders one row per parsed line of the canonical bracketed string. Each row hosts a chord input and a lyric input. Today the row strip exposes five operations as 1rem hover-only icons: `Copy chord` (OS clipboard), `Move down`, `Move up`, `Select`, `Paste`. The page-level `HelpersBar` adds `Undo`, `Clear selected`, and `Enable edit lyrics`.

Three core problems:

- **Wrong move semantics.** `moveDown(N)` strips the chord from line N and writes it onto line N+1 (destroying the existing chord there). `moveUp(N)` splices out `lines[N-1]` — it deletes the line above. Neither is a paired, reversible operation. The user's mental model is "move this chord to sit above a different lyric line", not "swap entire canonical lines".
- **Selection-model surprise.** The single-range state machine produces non-standard behaviour. No `shift+click`, no `cmd+click`, no non-contiguous selection.
- **Broken paste.** `pasteSelected` has an off-by-one bug (`slice(targetIdx + selectedLines.length + 1)` drops one extra row). The operation also overwrites rows (rather than inserting), which is destructive and unintuitive.

**The fundamental principle driving this redesign:** Lyrics are the immovable structure of the chord sheet. Chords are independent values that sit above lyric lines. All chord-row operations manipulate chord values only; lyric text is never moved or removed by a chord operation.

The constraints we work under:

- The canonical string in `CanonicalReducer.value` remains the single source of truth. All operations rewrite the canonical string.
- The left textarea continues to mirror the canonical string. Chord-only mutations must produce a canonical string that round-trips through `parseCanonical → formatBracketed*`.
- Existing chord-classifier rules (chord-only lines, silent-rest empty lines from Rule B) continue to work.
- `useSelector(selectRows)` is memoised on the canonical string + lineIds. Stable keys are derived from `lineIds` (nanoid per line, regenerated on `setCanonical` via LCS diff).

## Goals / Non-Goals

**Goals**

- Chord-only move: `moveUp`/`moveDown` swap chord values; lyrics stay in place.
- Multi-row chord move: block of selected chord values shifts one position up/down (rotation semantics).
- OS-standard mouse selection: click / shift+click / cmd+click / Esc / Cmd+A.
- Non-contiguous selection.
- Always-visible selection state (highlighted rows + selection pill).
- Bulk chord operations in a contextual action bar.
- Paste = overwrite chord values at target going downward (not insert).
- Cut = copy chord values + clear from source (not delete canonical lines).
- Full keyboard support with ARIA listbox semantics.
- Inline undo via snackbar for destructive chord operations.
- Touch-usable: no operations gated solely on hover.

**Non-Goals**

- Whole-line reorder (moving lyric + chord together). Lines stay in canonical order.
- Drag-and-drop reorder of canonical lines. (May be added in a follow-up if users request it.)
- Cross-document copy/paste via OS clipboard for row payloads.
- Deleting canonical lines via the chord-row UX. Line deletion remains a manual edit in the lyrics textarea.
- Replacing the global `Undo` button.
- Mobile-first redesign of the editor at large.

## Decisions

### Decision: Move semantics — chord-value swap, lyrics immovable

**What:** `moveUp(N)` extracts the chord string from line N and the chord string from line N-1, swaps them, rebuilds both lines with their original lyric texts, and writes back to the canonical. `moveDown(N)` does the same with N and N+1. Both clamp at boundaries (no-op, no history push on no-op).

For a contiguous multi-row selection `[minIdx..maxIdx]`, move up performs a left-rotation of chord values in the range `[minIdx-1 .. maxIdx]`: the chord above the block shifts to position `maxIdx`, and the block shifts up by one. Move down is the mirror: right-rotation of `[minIdx .. maxIdx+1]`.

Helper:
- `extractChord(line: string): string` — returns the chord portion of a canonical line (bracket content for `[chord]lyric`, full line for chord-only).
- `extractLyric(line: string): string` — returns the lyric portion.
- `rebuildLine(chord: string, lyric: string): string` — returns `[chord]lyric` if both non-empty, `lyric` if chord empty, `chord` if lyric empty, `''` if both empty.

**Why:** Two arrow icons must execute a paired, reversible operation. The user's intent when clicking "move chord up" is "I want this chord to sit above the lyric one line higher" — not "swap the entire lines". Keeping lyrics fixed preserves the song structure and makes the operation safe for all row types.

**Alternatives considered:**

- *Symmetric whole-line swap (originally proposed):* Swaps entire canonical lines (chord + lyric together). Rejected — lyric text moves, which is confusing and dangerous. The arrows should move chords, not shuffle verses.
- *Keep the original destructive chord-migration:* Asymmetric (no paired inverse). Rejected.

### Decision: Selection state — `{ anchor?: number; indexes: number[] }`

**What:** Replace `SelectedChordRows = { from?: number; to?: number }` with `{ anchor?: number; indexes: number[] }`. `anchor` is the pivot for shift-extend. `indexes` is the sorted array of selected row indexes.

```ts
type SelectionMode = 'single' | 'range' | 'toggle';
setSelected({ index: number; mode: SelectionMode })
```

- `single`: `{ anchor: index, indexes: [index] }`. If clicking the only selected row, clears.
- `range`: extend from `anchor` to `index`. `anchor` unchanged.
- `toggle`: add/remove `index`. Updates `anchor` to `index`.

**Why:** Matches OS conventions exactly. Decouples selection from the contiguous-range constraint.

### Decision: Clipboard holds chord VALUE strings; paste overwrites downward

**What:**

- `clipboard: string[]` on `CanonicalState` holds extracted chord strings (not whole canonical lines).
- `copySelected()` writes `selectedIndexes.map(i => extractChord(lines[i]))` to the clipboard.
- `cutSelected()` does the same, then sets the chord at each source row to `''`, rebuilds those lines, pushes history, pushes toast.
- `pasteChords(targetIdx)` replaces chord values at rows `targetIdx, targetIdx+1, targetIdx+2, …` with clipboard values. Lyrics at those rows are untouched. Pushes history, pushes toast.

**Why:** The user's stated intent: "copy 3 chord rows, paste at row 5 → rows 5, 6, 7 get those chords; lyrics stay". This is an overwrite (replace) model, not an insert model. Using chord strings (not whole lines) in the clipboard means paste cannot accidentally corrupt lyrics.

**Alternatives considered:**

- *Insert-after model (previously proposed):* Inserts new canonical lines, displacing existing lyrics downward. Rejected — this is whole-line manipulation. The user wants chord manipulation.
- *OS clipboard for row buffer:* Needs serialization format + security review. Deferred.

### Decision: Cut/clear do not delete canonical lines

**What:**

- `cutSelected()` clears chord values from selected rows (sets them to `''`); the lyric lines remain in the canonical. Selected rows become chord-empty rows.
- `clearChords()` (action bar "Clear chords") does the same without copying to clipboard.

**Why:** Deleting canonical lines removes lyrics, which violates the "lyrics are immovable" principle. Clearing only the chord part is safer and reversible via undo.

### Decision: Stable per-line id for React key

**What:** Add `lineIds: string[]` to `CanonicalState`. On `setCanonical`, regenerate via LCS diff. On `replaceLine(N)`, mint a new id for N. `lineIds` is spliced in lockstep on chord-swap operations. Exposed through `selectRows` as `row.id`.

**Why:** React row keys are currently content-based, causing unnecessary remounts. Stable ids make future animation work cheaper.

### Decision: Action bar is sticky to the bottom of the editor pane

**What:** When `indexes.length > 0`, render sticky bar at bottom of `.ChordSheetEditor`: row count pill, `Move ↑`, `Move ↓`, `Copy`, `Cut`, `Paste` (enabled when clipboard non-empty AND a hover/focus target exists), `Clear chords`, `Clear selection`.

**Why:** Disambiguates bulk chord operations. Touch-usable.

### Decision: Snackbar with `Undo` for destructive chord operations

**What:** `ToastReducer` holds one toast `{ message: string; showUndo: boolean; dismissAt: number }`. `cutSelected`, `clearChords`, `pasteChords` push a toast. The `Undo` button dispatches the global `undo()` action (which pops canonical history) and dismisses.

**Why:** Chord operations that clear or overwrite data need an escape hatch. The global canonical history already tracks the pre-operation state, so `undo()` is sufficient — no need to store inverse actions in the toast.

### Decision: No drag-and-drop in this change

**What:** Drag-and-drop for whole-line reorder is explicitly out of scope. The drag handle added to rows in section 5 is removed from the new design.

**Why:** DnD makes sense for whole-line reordering. Since this change establishes that lyrics are immovable, whole-line DnD directly contradicts the model. Chord-value DnD (dragging a chord to a different row) is a possible future enhancement but is complex UI.

## Risks / Trade-offs

- **Test churn.** E2E tests and reducer unit tests for move/paste semantics need full rewrite. Mitigation: rewrite in lockstep.
- **Keyboard-handler footgun.** `Cmd+C/X/V` at editor level shadows browser native copy/paste when user has text selected inside an input. Mitigation: handlers return early if `document.activeElement` is `INPUT` or `TEXTAREA`.
- **Chord-extract ambiguity on chord-only lines.** For lines with no lyric (`Am G F`, not `[Am]lyrics`), the "chord" IS the whole line and the "lyric" is empty. `rebuildLine('', '')` → `''`, making the row a silent-rest. This is correct behaviour (cutting a chord-only row leaves a blank line) but needs explicit test coverage.
- **Multi-row rotation with empty boundary chords.** Left-rotating `[minIdx-1..maxIdx]` when line N-1 has no chord is fine — it becomes the new bottom-of-block chord (likely empty string → that row becomes chord-empty after the move, which is correct).

## Migration Plan

1. Land behind `enableNewRowUx` feature flag (default `false`). Keep old icon strip when flag is off.
2. Rewrite unit and E2E tests to cover new chord-only semantics.
3. Flip flag default to `true`.
4. Remove flag and old icon strip in follow-up cleanup change.
