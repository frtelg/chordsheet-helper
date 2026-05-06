## 1. Selection State Refactor

- [x] 1.1 Replace `SelectedChordRows = { from?, to? }` with `{ anchor?: number; indexes: number[] }` (sorted-array-backed set) in `src/lib/selectedrows/SelectedChordRows.ts`
- [x] 1.2 Replace the `NothingSelected | OneRowSelected | RangeSelected` state machine with a pure function `applySelection(state, { index, mode: 'single' | 'range' | 'toggle' }) => state`
- [x] 1.3 Add `selectAll(rowCount: number)` and `clearSelection()` helpers
- [x] 1.4 Rewrite `SelectedChordRows.spec.ts` to cover: empty → single, single → range, range → range extension forward/backward, range collapse to single, toggle add/remove, toggle on empty, click same single → clear, select-all, clear, mode dispatch precedence
- [x] 1.5 Update `CanonicalReducer.setSelected` to accept the new payload `{ index: number; mode: SelectionMode }`; update `clearSelected` reducer to call `clearSelection()`

## 2. Chord-Only Operations

> **Principle:** Lyrics are immovable. All operations manipulate chord VALUES only. No canonical line is ever deleted by a chord operation.

- [ ] 2.1 Add `extractChord(line: string): string` helper in `src/lib/onsong/lineHelpers.ts` — returns bracket content for `[chord]lyric`, the whole line for chord-only lines, `''` for lyric-only or empty lines
- [ ] 2.2 Add `extractLyric(line: string): string` helper — returns lyric portion after `]`, empty string for chord-only or empty lines
- [ ] 2.3 Add `rebuildLine(chord: string, lyric: string): string` helper — returns `[chord]lyric` if both non-empty, `lyric` if chord empty, `chord` if lyric empty, `''` if both empty
- [ ] 2.4 Rewrite `moveUp(N)` as chord-value swap: extract chord from `lines[N]` and `lines[N-1]`, swap, rebuild both lines with their original lyrics, push history. Clamp at index 0 (no-op, no history push). Lyrics stay in place.
- [ ] 2.5 Rewrite `moveDown(N)` as chord-value swap with `lines[N+1]`. Clamp at last index.
- [ ] 2.6 For a contiguous multi-row selection `[minIdx..maxIdx]`: `moveUp` performs left-rotation of chord values in `[minIdx-1..maxIdx]` (chord above block shifts to bottom of block, block shifts up by one); `moveDown` performs right-rotation of `[minIdx..maxIdx+1]`. Single-row selection calls the single-swap path.
- [ ] 2.7 Remove `moveRow({ from, to })` (whole-line DnD reorder is out of scope for this change)
- [ ] 2.8 Update `clipboard: string[]` field in `CanonicalState` to hold chord VALUE strings (not whole lines)
- [ ] 2.9 Rewrite `copySelected()`: writes `selected.indexes.map(i => extractChord(lines[i]))` to `state.clipboard`. No history push. Selection preserved.
- [ ] 2.10 Rewrite `cutSelected()`: same as copySelected, then sets chord to `''` on each source row via `rebuildLine('', extractLyric(lines[i]))`. One history entry. Pushes "Cut N chord(s)" toast with undo. Does NOT delete canonical lines.
- [ ] 2.11 Add `pasteChords(targetIdx: number)`: replaces chord values at rows `targetIdx, targetIdx+1, …` with clipboard values (downward overwrite). Lyrics at those rows untouched. One history entry. Pushes "Pasted N chord(s)" toast with undo. Does NOT insert new canonical lines.
- [ ] 2.12 Add `clearChords()`: sets chord to `''` on each row in `selected.indexes` (same rebuild as cutSelected but no clipboard write). One history entry. Pushes "Cleared N chord(s)" toast with undo.
- [ ] 2.13 Remove `pasteAfter`, `deleteSelected`, and `duplicateRow` actions (whole-line operations; violate lyrics-immovable principle)
- [ ] 2.14 Rewrite `CanonicalReducer.spec.ts` covering: moveUp/Down at boundaries (no-op, no history), single-swap in the middle, swap involving chord-only line, swap involving lyric-only line, multi-row left/right rotation, copy → pasteChords produces expected chord values with lyrics intact, cutSelected clears chords without deleting lines, pasteChords overwrites chord values downward, clearChords sets chords to empty, undo through every new action

## 3. Stable Line IDs

- [x] 3.1 Add `lineIds: string[]` field to `CanonicalState`
- [x] 3.2 On `setCanonical`, recompute `lineIds` via line-by-line LCS-style diff against the previous canonical, preserving ids for unchanged or shifted lines and minting new ids (`nanoid()`) for new lines
- [x] 3.3 On `replaceLine(N)`, mint a new id for `lineIds[N]`
- [ ] 3.4 On `moveUp`/`moveDown`: do NOT swap `lineIds` — chord-only moves do not reorder canonical lines. On `cutSelected`/`clearChords`/`pasteChords`: `lineIds` remain in canonical order unchanged. Remove `lineIds` splicing from any removed whole-line actions.
- [x] 3.5 Expose `lineIds` through the row selector so that `Row.id` is the stable id; remove the content-based React key
- [x] 3.6 Unit tests: identical canonical content but reordered lines preserves ids; an inserted line gets a new id; a replaced line gets a new id; an undo restores the prior id sequence

## 4. Selection Action Bar

- [x] 4.1 Create `src/container/ChordSheetEditor/SelectionActionBar/index.tsx` rendering the row-count pill and buttons
- [x] 4.2 Render bar inside `.ChordSheetEditor` with `position: sticky; bottom: 0`; only when `indexes.length > 0`
- [ ] 4.3 `Move ↑` / `Move ↓` buttons: enabled when selection is contiguous AND not at the corresponding boundary; dispatch multi-row chord-rotation (section 2.6)
- [ ] 4.4 `Paste` button: enabled when `clipboard.length > 0` AND exactly one row has focus or hover; dispatches `pasteChords(focusedIdx)`
- [ ] 4.5 `Copy` → `copySelected`; `Cut` → `cutSelected`; `Clear chords` → `clearChords`; `Clear selection` → `clearSelected`. Remove `Delete` button entirely.
- [ ] 4.6 Unit tests for the bar: button-enable logic for each combination of selection size, clipboard presence, focus presence
- [x] 4.7 CSS: `.SelectionActionBar` matches the existing `HelpersBar` aesthetic (same surface, border, gap)

## 5. Per-Row UI — Kebab Menu and Selection Visuals

- [x] 5.1 In `src/container/ChordSheetEditor/ChordSheetRow/index.tsx`, remove the legacy icon strip
- [ ] 5.2 Remove the drag handle (`mdiDrag`) and all `useSortable` / dnd-kit wiring from `ChordSheetRow` (DnD is out of scope for this change)
- [x] 5.3 Kebab menu items: `Move up`, `Move down`, `Clear chord` (replaces Delete — sets chord to `''` on this row only), `Copy chord text` (OS clipboard). Remove `Duplicate` and `Delete` items.
- [x] 5.4 Make the row a `role="option"`, expose `aria-selected`, `tabIndex={isFocused ? 0 : -1}`
- [x] 5.5 Click handler dispatches `setSelected({ index, mode })` for single/range/toggle; ignores clicks inside chord/lyric inputs
- [x] 5.6 CSS for selected rows: 3px left border in `--color-accent`, subtle `--color-accent-subtle` background
- [ ] 5.7 Component-level tests: click modes dispatch correctly, kebab menu opens and dispatches each chord-only action, aria attributes reflect selection state

## 6. Editor-Level Keyboard and Listbox Wiring

- [x] 6.1 In `src/container/ChordSheetEditor/index.tsx`, wrap rows in `role="listbox"` + `aria-multiselectable="true"`
- [x] 6.2 Add a focused-row state (`useState<number | null>`); render the corresponding row with `tabIndex={0}`
- [ ] 6.3 Remove `DndContext` / `SortableContext` / sensor setup from `ChordSheetEditor` (DnD out of scope)
- [ ] 6.4 Update `keydown` handlers (each early-returns when `document.activeElement` is `INPUT` or `TEXTAREA`):
   - `ArrowDown`/`ArrowUp` — move focus
   - `Space` — toggle selection of focused row (`mode: 'toggle'`)
   - `Shift+ArrowDown`/`Shift+ArrowUp` — extend selection (`mode: 'range'`)
   - `Cmd/Ctrl+ArrowDown`/`Cmd/Ctrl+ArrowUp` — `moveDown(focusedRow)` / `moveUp(focusedRow)` (chord-only swap)
   - `Cmd/Ctrl+C` — `copySelected`
   - `Cmd/Ctrl+X` — `cutSelected`
   - `Cmd/Ctrl+V` — `pasteChords(focusedRow)` if clipboard non-empty
   - `Cmd/Ctrl+A` — select all
   - `Esc` — clear selection
   - Remove `Delete`/`Backspace` → `deleteSelected` (whole-line delete is out of scope)
- [x] 6.5 Aria-live region announcing selection-count changes
- [ ] 6.6 E2E coverage of every shortcut

## 7. Toast / Snackbar with Undo

- [x] 7.1 `src/redux/reducer/ToastReducer.ts` with `pushToast` and `dismissToast` actions
- [x] 7.2 `src/components/Snackbar/index.tsx` with auto-dismiss timer
- [x] 7.3 `<Snackbar />` mounted in app root
- [ ] 7.4 Wire `cutSelected`, `clearChords`, and `pasteChords` to `pushToast` with `showUndo: true`; `Undo` button dispatches global `undo()` and dismisses toast
- [ ] 7.5 Remove wiring to `deleteSelected` / `pasteAfter` (removed actions)
- [ ] 7.6 Tests: toast appears for cut/clear/paste; clicking `Undo` dispatches undo and dismisses; auto-dismiss after 5s

## 8. HelpersBar Cleanup

- [x] 8.1 Remove the `Clear selected chord rows` icon from `HelpersBar`
- [x] 8.2 Keep `Undo` and `Enable edit lyrics`
- [ ] 8.3 Update `HelpersBar` snapshot/unit test if any

## 9. Feature Flag and Migration

- [x] 9.1 `enableNewRowUx: boolean` in `AppReducer`
- [x] 9.2 Conditionally render old icon strip OR new UI based on flag
- [x] 9.3 Land change behind flag; smoke-test
- [x] 9.4 Flip default to `true`
- [ ] 9.5 In a follow-up cleanup change, remove the flag, old icon strip, and legacy `SelectedChordRows` state-machine classes

## 10. End-to-End

- [ ] 10.1 Rewrite `e2e/tests/row-operations.spec.ts`:
   - move down on row 0 swaps the chord value between rows 0 and 1; lyrics unchanged
   - move up on row 1 swaps the chord value between rows 0 and 1; lyrics unchanged
   - move at boundaries is a no-op (canonical unchanged)
   - multi-row selection: move up rotates chord values left; lyrics stay in place
- [ ] 10.2 Rewrite `e2e/tests/row-selection.spec.ts`:
   - click selects single row
   - shift+click extends range from anchor
   - cmd+click toggles non-contiguous rows
   - Esc clears selection
   - Cmd+A selects all rows
   - selection pill shows correct count
- [ ] 10.3 Rewrite `e2e/tests/row-clipboard.spec.ts`:
   - copy → pasteChords overwrites chord values at target going downward; lyrics intact
   - cut → pasteChords round-trip: source rows have empty chords, target rows have original chords, lyrics unchanged throughout
   - undo via snackbar restores chord values after cut; restores after pasteChords
- [ ] 10.4 Delete `e2e/tests/row-dnd.spec.ts` (DnD is out of scope for this change)
- [ ] 10.5 Update `e2e/fixtures/chord-sheet-app.ts`: remove `dragRow`; update `selectRow` click position to avoid hitting chord/lyric inputs; update `clickActionBarButton` for chord-only action titles

## 11. Cleanup and Wolf Hygiene

- [ ] 11.1 Delete `pasteAfter`, `deleteSelected`, `duplicateRow`, `moveRow` action code from `CanonicalReducer.ts`
- [ ] 11.2 Delete `NothingSelected` / `OneRowSelected` / `RangeSelected` classes from `SelectedChordRows.ts` (if any remain)
- [ ] 11.3 Remove `@dnd-kit/core` and `@dnd-kit/sortable` from `package.json` (no longer used)
- [ ] 11.4 Update `.wolf/anatomy.md` for new/changed files (`SelectionActionBar`, `Snackbar`, `ToastReducer`, `lineHelpers`)
- [ ] 11.5 Update `.wolf/cerebrum.md` Key Learnings with the chord-only model and new clipboard semantics

## 12. Quality Gate

- [ ] 12.1 `yarn test --watchAll=false` — all suites pass
- [ ] 12.2 `yarn build` — no errors
- [ ] 12.3 `yarn playwright test` — all specs pass (including rewritten row-operations, row-selection, row-clipboard)
- [ ] 12.4 Manual smoke: paste a real song, move individual chords up/down, select a block and move it, copy chord values and paste onto different rows, cut + undo, verify lyrics never move
