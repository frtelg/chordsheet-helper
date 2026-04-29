## Context

The chord-sheet editor renders one row per parsed line of the canonical bracketed string. Each row hosts a chord input, a lyric input, and a strip of icons. Today the row strip exposes five operations as 1rem icons: `Copy chord` (to OS clipboard), `Move down`, `Move up`, `Select` (visible on hover or when selected), `Paste` (visible on hover only when a selection exists). The page-level `HelpersBar` adds `Undo`, `Clear selected`, and `Enable edit lyrics`. Selection state is `{ from?: number; to?: number }` representing one contiguous range, with hand-rolled state-machine logic in `src/lib/selectedrows/SelectedChordRows.ts` that mutates the range in non-OS-standard ways on each click.

Three things are wrong:

- **Semantics drift.** `moveUp` and `moveDown` are not paired operations. `moveDown(N)` calls `parseBracketedLine(lines[N])`, strips the chord from line N, and writes that chord onto line N+1. `moveUp(N)` simply splices out `lines[N-1]` — it deletes the line above. Looking at the icons (`mdiChevronTripleUp`, `mdiChevronTripleDown`), a user expects a paired "move this row" operation. The implementation is two unrelated mutations.
- **Selection-model surprise.** The single-range state machine produces non-standard click behaviour. Clicking row 1 → `{from: 1}`. Clicking row 5 → `{from: 1, to: 5}`. Clicking row 3 → `{from: 1, to: 2}` (collapses *toward* the anchor). Clicking row 1 again → `{from: 2, to: 5}` (drops the anchor). Users coming from any file manager, mail client, or DAW expect `click = single`, `shift+click = extend`, `cmd+click = toggle`. None of those work today.
- **Discoverability gaps.** Hover-only paste icon (no touch path), no drag handle, no kebab menu, no keyboard support, no row-level highlight for selection. Bulk operations live behind per-row icons rather than a contextual bar.

There is also a latent bug in `pasteSelected`: it computes `after = lines.slice(targetIdx + selectedLines.length + 1)`, dropping one extra row at the splice boundary. The slice should be `targetIdx + selectedLines.length` for an overwrite, or — preferred in this design — the operation should not overwrite at all.

The constraints we work under:

- The canonical string in `CanonicalReducer.value` remains the single source of truth. All row operations rewrite the canonical string.
- The left textarea continues to mirror the canonical string. Any change to row order, deletion, or insertion must produce a canonical string that round-trips through `parseCanonical → formatBracketed*`.
- Existing chord-classifier rules (chord-only lines, silent-rest empty lines from Rule B) must continue to work; row indexes are line indexes in the canonical string, so swap is a swap of two lines as-is.
- `useSelector(selectRows)` is memoised on the canonical string; row identity is currently keyed by `${sourceLineIndex}-${chord}-${lyric}`. Drag-and-drop reorder needs stable keys for animation, so we will derive a per-line stable id at the slice level (e.g. `nanoid()` on `setCanonical` and on each `replaceLine`).

## Goals / Non-Goals

**Goals**

- Symmetric, predictable row reorder via swap and via drag-and-drop.
- OS-standard mouse selection: click / shift+click / cmd+click / Esc / Cmd+A.
- Non-contiguous selection.
- Always-visible selection state (highlighted rows + selection pill).
- Bulk operations in a single contextual action bar.
- Full keyboard support with ARIA listbox semantics.
- Inline undo via snackbar for destructive bulk operations.
- Fix the off-by-one in paste.
- Touch-usable: no operations gated solely on hover.

**Non-Goals**

- Multi-row editing (typing chords across N rows at once).
- Cross-document copy/paste of rows (OS clipboard interop for row payloads).
- Reordering by dragging from inside an input — drag is from the handle only.
- Replacing the global `Undo` button. The page-level undo continues to operate on the canonical-string history.
- Mobile-first redesign of the editor at large. We add touch parity for these specific operations only.

## Decisions

### Decision: Move semantics — symmetric row swap, no longer a chord migration

**What:** `moveUp(N)` swaps `lines[N]` with `lines[N-1]`. `moveDown(N)` swaps `lines[N]` with `lines[N+1]`. Both clamp at the boundaries (no-op, no history push). The current "shift chord onto next lyric" behaviour is removed.

**Why:** Two arrow icons that look like a paired control must execute a paired operation. The chord-migration semantics is actually a different intent ("push this chord one lyric line later") and never had a corresponding `moveUp` reverse, so it is unrecoverable except via global Undo. Row swap is the canonical, reversible operation users expect from up/down arrows.

**Alternatives considered:**

- *Keep the chord-migration semantics, rename the down arrow to "push chord later":* Preserves the existing E2E test but introduces an asymmetric pair (no "pull chord earlier"). User intent for chord movement is better served by editing the chord input directly or by drag-and-drop of the chord cell — out of scope here.
- *Make moveDown a chord-migration AND moveUp the inverse (pull chord up from N+1):* Adds a second operation type that competes with row swap and complicates the kebab menu. Rejected for cognitive load.

### Decision: Selection state — `{ anchor?: number; indexes: number[] }`

**What:** Replace `SelectedChordRows = { from?: number; to?: number }` with `{ anchor?: number; indexes: number[] }`. `anchor` is the last clicked row (the pivot for shift-extend). `indexes` is the unordered set of selected row indexes, stored as a sorted array for deterministic equality checks.

The selection action accepts a mode discriminator:

```ts
type SelectionMode = 'single' | 'range' | 'toggle';
setSelected({ index: number; mode: SelectionMode })
```

- `single`: `{ anchor: index, indexes: [index] }`. If clicking the only selected row, clears.
- `range`: extend from `anchor` to `index`. `anchor` itself is unchanged.
- `toggle`: add/remove `index` from `indexes`. Updates `anchor` to `index`.

**Why:** Matches OS conventions exactly. A `Set`-style backing store decouples selection from the contiguous-range constraint and lets us ditch the bespoke state machine in `SelectedChordRows.ts`.

**Migration of existing E2E and unit tests:** The old `SelectedChordRows.spec.ts` asserts contiguous-range collapse rules that no longer exist. Tests are rewritten to assert the new mode semantics. `pasteSelected` no longer needs to expand a `[from, to]` into an array — it reads `indexes` directly.

### Decision: Two clipboards — internal row clipboard, separate OS chord-text clipboard

**What:**

- *Internal row clipboard:* `clipboard: string[]` field on `CanonicalState`. Holds raw canonical lines. Written by `copySelected` and `cutSelected`. Read by `pasteAfter(targetIdx)`, which inserts (does not overwrite) the lines after the target.
- *OS chord-text clipboard:* The kebab menu item `Copy chord text` calls `copy(row.chord)` against the OS clipboard. This is the only OS-clipboard interaction in the editor.

**Why:** The two operations are conceptually different and currently share an icon set, which causes confusion. Splitting them lets each have an unambiguous label and a single behaviour. Insert-after (rather than overwrite) is the safer default and matches user expectation for "paste rows here". It also fixes the off-by-one bug in the current slice math.

**Alternatives considered:**

- *Use the OS clipboard for the row buffer too:* Would let users paste rows across browser tabs of the app. Rejected for v1 — needs a serialization format (raw canonical lines? JSON?) and security review around `navigator.clipboard.read`. Track separately.
- *Single overwrite paste with a confirm dialog:* Adds friction for the common case (paste a copied chorus after the verse). Insert-after is the natural undo-able default; overwrite can be added later if users ask for it.

### Decision: Drag-and-drop reorder via `dnd-kit`

**What:** Use `@dnd-kit/core` + `@dnd-kit/sortable` for drag handle reorder. The drag handle is an mdi grip icon (`mdiDragHorizontalVariant`) revealed on row hover or when the row has keyboard focus.

**Why:** `dnd-kit` is the modern, accessible, headless DnD library for React: it ships keyboard, screen-reader, and pointer drivers; works under React 18 strict mode; and integrates cleanly with controlled lists. We avoid `react-beautiful-dnd` (unmaintained, no React 18 support) and `react-dnd` (heavier, less accessible). The library is ~10kB gzipped.

The drop dispatches a single `moveRow({ from, to })` action that rewrites the canonical string by splicing line `from` to position `to`. This is one history entry per drop, regardless of distance.

### Decision: Stable per-line id for animation and React key

**What:** Add a parallel `lineIds: string[]` array on `CanonicalState`. On `setCanonical`, regenerate the array via line-by-line longest-common-subsequence diff against the previous canonical, preserving ids for unchanged or shifted lines. On `replaceLine(N)`, regenerate `lineIds[N]` (line content changed). On `moveRow`/swap, splice the ids in lockstep.

**Why:** React row keys are currently `${sourceLineIndex}-${chord}-${lyric}`, which makes every input commit remount the row (acceptable today because inputs commit on blur). Drag animations need a stable key across reorder. A separate id array gives stable identity without coupling it to row content.

**Alternatives considered:**

- *Use `sourceLineIndex` as the React key:* Breaks animations on reorder — the same DOM node represents different rows on adjacent renders.
- *Hash content for the key:* Two identical empty lines would collide. Counter argument: collisions are common with silent-rest rows (Rule B).

### Decision: Action bar is sticky to the bottom of the editor pane

**What:** When `indexes.length > 0`, render a sticky bar at the bottom of `.ChordSheetEditor` containing: row count pill, `Move ↑`, `Move ↓`, `Copy`, `Cut`, `Paste after target` (only when clipboard non-empty AND a single row has focus or hover), `Delete`, `Clear`. The bar is `position: sticky; bottom: 0` inside the scrolling editor container.

**Why:** The bar disambiguates bulk operations from per-row operations and makes touch usage feasible. Sticky at the bottom keeps the action close to the rows the user just selected (most users select top-down).

**Alternatives considered:**

- *Floating action button (FAB):* Hides destination of paste; users would have to remember the target row.
- *Top-of-editor bar:* Far from the rows on a long sheet; more mouse travel.

### Decision: Snackbar with `Undo` for destructive bulk ops

**What:** A new lightweight toast slice (`src/redux/reducer/ToastReducer.ts`) holds at most one toast `{ message: string; undoAction?: () => Action; dismissAfterMs: number }`. `cutSelected`, `deleteSelected`, `pasteAfter`, and bulk `move` push a toast with the `undo` action. The toast renders bottom-center; auto-dismisses at 5s.

**Why:** Even with the global Undo button, a destructive bulk op feels safer with an inline confirmation. The snackbar is also where we surface "Pasted 4 rows after row 12" feedback so the user knows what happened.

**Alternatives considered:**

- *Confirmation modal before destructive op:* Friction for the common case.
- *Optimistic with no toast:* Existing model. Insufficient feedback.

## Risks / Trade-offs

- **Test churn.** Every E2E that asserts the old move semantics needs a rewrite. `e2e/tests/row-operations.spec.ts` (3 tests) is the main impact. Unit tests for `SelectedChordRows` and the pasteSelected reducer are also rewritten. Mitigation: rewrite both in lockstep with the implementation.
- **`dnd-kit` adds a runtime dependency.** ~10kB gzipped. Acceptable; the editor is the heaviest container in the app and DnD is now table-stakes.
- **Keyboard-handler footgun.** Capturing `Cmd+C/X/V` at the editor level could shadow the browser's native copy/paste when the user has selected text inside an input. Mitigation: handlers ignore the event if `document.activeElement` is an `INPUT` or `TEXTAREA`.
- **Stable line ids on left-textarea edits.** Live left-textarea typing dispatches `setCanonical` on every keystroke. Computing an LCS diff per keystroke is fine for sub-thousand-line sheets (negligible) but worth measuring. Fallback: regenerate all ids on a wholesale `setCanonical` and only diff on `replaceLine`/swap/`moveRow`.
- **Selection across silent-rest rows.** Selection is by line index, so a range that crosses a silent-rest line includes the rest. Cut/delete then removes the silent-rest line from the canonical, which alters Rule B classification of the surrounding empties. This is the correct behaviour (the user selected and removed those lines) but worth covering in tests.
- **Discoverability of new keyboard shortcuts.** A small `?` button in `HelpersBar` opens a keyboard-shortcuts cheat sheet. Out of scope for this change but recommended as a follow-up.

## Migration Plan

1. Land the new selection state, kebab menu, and action bar behind a feature flag (`enableNewRowUx` in `AppReducer`). Keep the old icon strip rendering when the flag is off.
2. Migrate `e2e/tests/row-operations.spec.ts` to drive both modes in parallel for one cycle.
3. Flip the flag default to on. Burn down any regression reports.
4. Remove the old icon strip and the flag in a follow-up cleanup change.

## Open Questions

- Should `Cmd+A` select all rows in the editor, or all text in the focused input? The proposal goes with "all rows when the listbox container has focus, all text when an input has focus". Confirm with the user once implemented.
- Should `Delete` with no selection delete the focused row, or no-op? Proposal: delete the focused row, with the focused row visually highlighted by a focus ring so the user is not surprised.
- Drag-and-drop across silent-rest gaps: does the user expect the silent rests to come along, or to stay where they were? Proposal: line index is the source of truth, so a silent-rest line is just a line and gets dragged like any other. Tests will cover this explicitly.
