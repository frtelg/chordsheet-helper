## 1. Selection State Refactor

- [ ] 1.1 Replace `SelectedChordRows = { from?, to? }` with `{ anchor?: number; indexes: number[] }` (sorted-array-backed set) in `src/lib/selectedrows/SelectedChordRows.ts`
- [ ] 1.2 Replace the `NothingSelected | OneRowSelected | RangeSelected` state machine with a pure function `applySelection(state, { index, mode: 'single' | 'range' | 'toggle' }) => state`
- [ ] 1.3 Add `selectAll(rowCount: number)` and `clearSelection()` helpers
- [ ] 1.4 Rewrite `SelectedChordRows.spec.ts` to cover: empty → single, single → range, range → range extension forward/backward, range collapse to single, toggle add/remove, toggle on empty, click same single → clear, select-all, clear, mode dispatch precedence
- [ ] 1.5 Update `CanonicalReducer.setSelected` to accept the new payload `{ index: number; mode: SelectionMode }`; update `clearSelected` reducer to call `clearSelection()`

## 2. Canonical Reducer — Move, Clipboard, Delete, Duplicate

- [ ] 2.1 Rewrite `moveUp` as symmetric line swap: clamp at index 0 (no-op, no history push); otherwise swap `lines[N]` with `lines[N-1]` and rejoin
- [ ] 2.2 Rewrite `moveDown` as symmetric line swap: clamp at last index (no-op, no history push); otherwise swap `lines[N]` with `lines[N+1]` and rejoin
- [ ] 2.3 Add `moveRow({ from: number; to: number })` for drag-and-drop: splice line `from` out, insert at `to`; one history entry per drop
- [ ] 2.4 Add `clipboard: string[]` field to `CanonicalState` initial state
- [ ] 2.5 Add `copySelected(state)` action: writes the lines at `state.selected.indexes` (in index order) into `state.clipboard`. No history push. Selection preserved.
- [ ] 2.6 Add `cutSelected(state)` action: copies as above, then deletes the lines, then clears selection. One history entry. Pushes a "Cut N rows" toast with undo.
- [ ] 2.7 Replace `pasteSelected(targetIdx)` with `pasteAfter(targetIdx)`: inserts `state.clipboard` lines after `lines[targetIdx]` (non-destructive). Selection becomes the newly inserted indexes. One history entry. Pushes a "Pasted N rows" toast with undo.
- [ ] 2.8 Add `deleteSelected(state)` action: removes lines at `state.selected.indexes`. Clears selection. One history entry. Pushes a "Deleted N rows" toast with undo.
- [ ] 2.9 Add `duplicateRow(rowIdx)` action: inserts a copy of `lines[rowIdx]` immediately after. One history entry.
- [ ] 2.10 Update `CanonicalReducer.spec.ts` covering: moveUp/Down at boundaries, moveUp/Down in the middle, swap involving silent-rest line, swap involving chord-only line, copy → paste-after produces expected canonical, cut → paste-after round-trip, delete with non-contiguous selection, duplicateRow at last index, undo through every new action

## 3. Stable Line IDs

- [ ] 3.1 Add `lineIds: string[]` field to `CanonicalState`
- [ ] 3.2 On `setCanonical`, recompute `lineIds` via line-by-line LCS-style diff against the previous canonical, preserving ids for unchanged or shifted lines and minting new ids (`nanoid()`) for new lines
- [ ] 3.3 On `replaceLine(N)`, mint a new id for `lineIds[N]`
- [ ] 3.4 On `moveUp`/`moveDown`/`moveRow`/`copySelected`/`cutSelected`/`pasteAfter`/`deleteSelected`/`duplicateRow`, splice `lineIds` in lockstep with `lines`
- [ ] 3.5 Expose `lineIds` through the row selector so that `Row.id` is the stable id; remove the content-based React key
- [ ] 3.6 Unit tests: identical canonical content but reordered lines preserves ids; an inserted line gets a new id; a replaced line gets a new id; an undo restores the prior id sequence

## 4. Selection Action Bar

- [ ] 4.1 Create `src/container/ChordSheetEditor/SelectionActionBar/index.tsx` rendering the row-count pill and buttons: `Move ↑`, `Move ↓`, `Copy`, `Cut`, `Paste after target`, `Delete`, `Clear`
- [ ] 4.2 Render bar inside `.ChordSheetEditor` with `position: sticky; bottom: 0`; only when `indexes.length > 0`
- [ ] 4.3 `Move ↑` / `Move ↓` buttons: enabled only when selection is contiguous AND not at the corresponding boundary; dispatch a sequence of swaps in the right order (descending for up, ascending for down) to slide the whole block one step
- [ ] 4.4 `Paste after target`: enabled only when `clipboard.length > 0` AND exactly one row has focus or hover; dispatches `pasteAfter(focusedIdx)`
- [ ] 4.5 `Copy` / `Cut` / `Delete` / `Clear`: dispatch the corresponding actions
- [ ] 4.6 Unit tests for the bar: button-enable logic for each combination of selection size, clipboard presence, focus presence
- [ ] 4.7 CSS: `.SelectionActionBar` matches the existing `HelpersBar` aesthetic (same surface, border, gap)

## 5. Per-Row UI — Drag Handle, Kebab Menu, Selection Visuals

- [ ] 5.1 In `src/container/ChordSheetEditor/ChordSheetRow/index.tsx`, remove the icon strip (`mdiContentCopy`, `mdiChevronTripleDown`, `mdiChevronTripleUp`, `mdiCheckboxMarked`, `mdiCheckboxBlankOutline`, `mdiContentPaste`)
- [ ] 5.2 Add a leading drag handle (mdi grip icon) revealed on row hover or row keyboard focus; wire it as the only valid drag target (see Section 7)
- [ ] 5.3 Add a trailing kebab menu (`mdiDotsVertical`) opening a popover with: `Move up`, `Move down`, `Duplicate`, `Delete`, `Copy chord text` (OS clipboard via `copy(row.chord)`)
- [ ] 5.4 Make the row a `role="option"`, expose `aria-selected`, `tabIndex={isFocused ? 0 : -1}` (roving tabindex managed by the parent listbox)
- [ ] 5.5 Click handler: `onClick(e)` translates `(e.shiftKey, e.metaKey || e.ctrlKey)` into `'single' | 'range' | 'toggle'` and dispatches `setSelected({ index, mode })`. Clicks inside the chord/lyric inputs do NOT toggle selection.
- [ ] 5.6 CSS for selected rows: 3px left border in `--color-accent`, subtle `--color-accent-subtle` background; non-selected hover keeps the existing surface tint
- [ ] 5.7 Component-level tests: click modes dispatch correctly, kebab menu opens and dispatches each action, drag handle emits drag-start with the right id, aria attributes reflect selection state

## 6. Editor-Level Keyboard and Listbox Wiring

- [ ] 6.1 In `src/container/ChordSheetEditor/index.tsx`, wrap the rows in a container with `role="listbox"` and `aria-multiselectable="true"`
- [ ] 6.2 Add a focused-row state (`useState<number | null>`); render the corresponding row with `tabIndex={0}`
- [ ] 6.3 Capture `keydown` at the listbox container, with handlers (each early-returns when `document.activeElement` is an `INPUT` or `TEXTAREA`):
   - `ArrowDown`/`ArrowUp` — move focus
   - `Space` — toggle selection of focused row (`mode: 'toggle'`)
   - `Shift+ArrowDown`/`Shift+ArrowUp` — extend selection (`mode: 'range'` with focused row as the new endpoint)
   - `Cmd/Ctrl+ArrowDown`/`Cmd/Ctrl+ArrowUp` — `moveDown`/`moveUp` of the focused row
   - `Cmd/Ctrl+C` — `copySelected`
   - `Cmd/Ctrl+X` — `cutSelected`
   - `Cmd/Ctrl+V` — `pasteAfter(focusedRow)` if clipboard non-empty
   - `Cmd/Ctrl+A` — select all
   - `Esc` — clear selection
   - `Delete` / `Backspace` — `deleteSelected` (or delete focused row if no selection)
- [ ] 6.4 Aria-live region announcing selection-count changes ("3 rows selected") and clipboard actions
- [ ] 6.5 E2E coverage of every shortcut

## 7. Drag-and-Drop with `dnd-kit`

- [ ] 7.1 Add `@dnd-kit/core` and `@dnd-kit/sortable` to `dependencies` in `package.json`
- [ ] 7.2 Wrap the rows list in `<DndContext>` and `<SortableContext items={lineIds} strategy={verticalListSortingStrategy}>`
- [ ] 7.3 Each row uses `useSortable({ id: row.id })`; the drag handle gets `listeners` and `attributes`; the row itself does not (so dragging only starts from the handle)
- [ ] 7.4 `onDragEnd` dispatches `moveRow({ from: oldIndex, to: newIndex })`
- [ ] 7.5 Configure the keyboard sensor for accessible drag-by-keyboard: `Space` to lift, arrows to move, `Space` again to drop, `Esc` to cancel
- [ ] 7.6 Unit/E2E tests: drag from row 1 to row 4 reorders correctly; keyboard-driven drag with sensors fires the same `moveRow`

## 8. Toast / Snackbar with Undo

- [ ] 8.1 Create `src/redux/reducer/ToastReducer.ts` with state `{ toast?: { message: string; undoAction?: { type: string; payload?: unknown }; dismissAt: number } }`
- [ ] 8.2 Add `pushToast` and `dismissToast` actions
- [ ] 8.3 Create `src/components/Snackbar/index.tsx` rendering the current toast at bottom-center with `Undo` button when `undoAction` is set; auto-dismisses on a timer
- [ ] 8.4 Mount `<Snackbar />` once in the app root (`src/App.tsx`)
- [ ] 8.5 Wire `cutSelected`, `deleteSelected`, `pasteAfter`, and any bulk-move action to `pushToast` with the inverse action set as `undoAction`
- [ ] 8.6 Tests: toast appears for each destructive op; clicking `Undo` dispatches the inverse and dismisses; auto-dismiss after 5s

## 9. HelpersBar Cleanup

- [ ] 9.1 Remove the `Clear selected chord rows` icon from `HelpersBar` (now lives in the action bar)
- [ ] 9.2 Keep `Undo` and `Enable edit lyrics`
- [ ] 9.3 Update `HelpersBar` snapshot/unit test if any

## 10. Feature Flag and Migration

- [ ] 10.1 Add `enableNewRowUx: boolean` to `AppReducer`, default `false`
- [ ] 10.2 Conditionally render either the old icon strip + old selection model OR the new UI based on the flag
- [ ] 10.3 Land the change behind the flag; smoke-test
- [ ] 10.4 Flip the default to `true` in a follow-up commit
- [ ] 10.5 In a follow-up cleanup change, remove the flag, the old icon strip, and the legacy `SelectedChordRows` state-machine classes

## 11. End-to-End

- [ ] 11.1 Rewrite `e2e/tests/row-operations.spec.ts`:
   - move down on row 0 swaps rows 0 and 1
   - move up on row 1 swaps rows 0 and 1
   - move at boundaries is a no-op
- [ ] 11.2 New `e2e/tests/row-selection.spec.ts`:
   - click selects single
   - shift+click extends
   - cmd+click toggles non-contiguous
   - Esc clears
   - Cmd+A selects all
   - selection pill shows count
- [ ] 11.3 New `e2e/tests/row-clipboard.spec.ts`:
   - copy → paste after produces an inserted block
   - cut → paste after round-trips
   - undo via snackbar restores after delete and after cut
- [ ] 11.4 New `e2e/tests/row-dnd.spec.ts`:
   - drag handle reorders a row
   - keyboard-driven drag (Space + Arrow + Space) reorders a row
- [ ] 11.5 Update `e2e/fixtures/chord-sheet-app.ts` with helpers: `selectRow`, `shiftSelectRow`, `cmdSelectRow`, `dragRow`, `getSelectionPillCount`, `clickActionBarButton`

## 12. Cleanup and Wolf Hygiene

- [ ] 12.1 Delete the old hover-only paste icon code and the `pasteSelected` action signature
- [ ] 12.2 Delete `NothingSelected` / `OneRowSelected` / `RangeSelected` classes
- [ ] 12.3 Update `.wolf/anatomy.md` for new files (`SelectionActionBar`, `Snackbar`, `ToastReducer`)
- [ ] 12.4 Update `.wolf/cerebrum.md` Key Learnings with the new selection model and clipboard semantics

## 13. Quality Gate

- [ ] 13.1 `yarn test --watchAll=false` — all suites pass
- [ ] 13.2 `yarn build` — no errors
- [ ] 13.3 `yarn playwright test` — all existing tests plus the new selection / clipboard / DnD specs pass
- [ ] 13.4 Manual smoke: paste a real song, exercise every shortcut, drag-reorder a chorus, cut + paste a verse, hit `Undo` from the snackbar, confirm canonical string is byte-correct
