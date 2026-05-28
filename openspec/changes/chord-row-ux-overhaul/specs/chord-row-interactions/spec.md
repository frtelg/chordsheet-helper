## ADDED Requirements

### Requirement: Symmetric move-row semantics

The `moveUp(N)` and `moveDown(N)` actions SHALL swap line `N` with its neighbour in the canonical string. `moveUp` swaps `lines[N]` with `lines[N-1]`; `moveDown` swaps `lines[N]` with `lines[N+1]`. At a boundary (`N === 0` for `moveUp`, `N === lines.length - 1` for `moveDown`) the action SHALL be a no-op and SHALL NOT push to the history stack.

#### Scenario: Move down on a middle row swaps with the next row
- **GIVEN** the canonical string is `"[Am]love\n[G]me\n[C]do"`
- **WHEN** the user dispatches `moveDown(1)`
- **THEN** the canonical string is `"[Am]love\n[C]do\n[G]me"`

#### Scenario: Move up on a middle row swaps with the previous row
- **GIVEN** the canonical string is `"[Am]love\n[G]me\n[C]do"`
- **WHEN** the user dispatches `moveUp(2)`
- **THEN** the canonical string is `"[Am]love\n[C]do\n[G]me"`

#### Scenario: Move up at the top is a no-op
- **WHEN** the user dispatches `moveUp(0)`
- **THEN** the canonical string is unchanged and no history entry is added

#### Scenario: Move down at the bottom is a no-op
- **GIVEN** a canonical string with `M` lines
- **WHEN** the user dispatches `moveDown(M - 1)`
- **THEN** the canonical string is unchanged and no history entry is added

#### Scenario: Swap involving a chord-only line preserves the chord-only line
- **GIVEN** the canonical string is `"[Am]love\n[G] [D]\n[C]me"`
- **WHEN** the user dispatches `moveDown(0)`
- **THEN** the canonical string is `"[G] [D]\n[Am]love\n[C]me"`

### Requirement: Drag-and-drop row reorder

The editor SHALL support drag-and-drop reorder of rows via a per-row drag handle and via keyboard. A drag that starts on the handle and ends on a different drop target SHALL dispatch a single `moveRow({ from, to })` action that splices the line at `from` to position `to` in the canonical string. The drop SHALL produce exactly one history entry regardless of distance.

#### Scenario: Drag row 0 to position 3
- **GIVEN** the canonical string has 5 lines indexed 0..4
- **WHEN** the user drags the handle of row 0 and drops it onto the gap below row 3
- **THEN** the canonical string lines are reordered to `[1, 2, 3, 0, 4]` and exactly one entry is pushed to the undo history

#### Scenario: Keyboard-driven drag
- **GIVEN** row 1 has keyboard focus
- **WHEN** the user presses `Space` to lift, `ArrowDown` twice, then `Space` to drop
- **THEN** row 1 moves to position 3 via the same `moveRow` action

#### Scenario: Cancelled drag
- **WHEN** the user starts a drag and presses `Esc` before dropping
- **THEN** the canonical string is unchanged and no history entry is added

### Requirement: OS-standard mouse selection model

The selection state SHALL be `{ anchor?: number; indexes: number[] }`. Mouse clicks on a row SHALL dispatch `setSelected({ index, mode })` where `mode` is derived from the modifier keys: no modifier → `'single'`; `shift` → `'range'`; `cmd` (macOS) or `ctrl` (other platforms) → `'toggle'`. Clicks inside the chord input or lyric input SHALL NOT change the selection.

#### Scenario: Click selects a single row
- **GIVEN** no rows are selected
- **WHEN** the user clicks row 3
- **THEN** the selection is `{ anchor: 3, indexes: [3] }`

#### Scenario: Click on the only selected row clears selection
- **GIVEN** the selection is `{ anchor: 3, indexes: [3] }`
- **WHEN** the user clicks row 3 with no modifier
- **THEN** the selection is `{ anchor: undefined, indexes: [] }`

#### Scenario: Shift+click extends from anchor forward
- **GIVEN** the selection is `{ anchor: 1, indexes: [1] }`
- **WHEN** the user shift+clicks row 4
- **THEN** the selection is `{ anchor: 1, indexes: [1, 2, 3, 4] }`

#### Scenario: Shift+click extends from anchor backward
- **GIVEN** the selection is `{ anchor: 4, indexes: [4] }`
- **WHEN** the user shift+clicks row 1
- **THEN** the selection is `{ anchor: 4, indexes: [1, 2, 3, 4] }`

#### Scenario: Shift+click after a previous range replaces the range
- **GIVEN** the selection is `{ anchor: 1, indexes: [1, 2, 3] }`
- **WHEN** the user shift+clicks row 5
- **THEN** the selection is `{ anchor: 1, indexes: [1, 2, 3, 4, 5] }`

#### Scenario: Cmd/Ctrl+click toggles a single row
- **GIVEN** the selection is `{ anchor: 1, indexes: [1, 2, 3] }`
- **WHEN** the user cmd+clicks row 5
- **THEN** the selection is `{ anchor: 5, indexes: [1, 2, 3, 5] }` (non-contiguous)
- **AND WHEN** the user cmd+clicks row 5 again
- **THEN** the selection is `{ anchor: 5, indexes: [1, 2, 3] }`

#### Scenario: Click inside an input does not change selection
- **GIVEN** the selection is `{ anchor: 1, indexes: [1] }`
- **WHEN** the user clicks inside the lyric input of row 4
- **THEN** the selection is unchanged and the lyric input gains keyboard focus

### Requirement: Selection visibility

Selected rows SHALL render with a left-border accent and a subtle background tint. A selection-count pill SHALL render in the top-right of the editor whenever `indexes.length > 0`, displaying the count and a `Clear` action. The pill SHALL be visible without hover.

#### Scenario: Selection pill reflects count
- **GIVEN** the selection has 3 rows
- **THEN** the pill text is `"3 rows selected"` and is visible without hover

#### Scenario: Empty selection hides the pill
- **GIVEN** the selection has 0 rows
- **THEN** the pill is not rendered

### Requirement: Contextual selection action bar

When `indexes.length > 0`, a sticky action bar SHALL appear at the bottom of the editor pane. The bar SHALL contain: row-count pill, `Move ↑`, `Move ↓`, `Copy`, `Cut`, `Paste after target`, `Delete`, `Clear`. The bar SHALL be hidden when the selection is empty.

#### Scenario: Bar appears on selection
- **WHEN** the user selects at least one row
- **THEN** the action bar is rendered sticky at the bottom of the editor

#### Scenario: Bar disappears on clear
- **GIVEN** the action bar is visible
- **WHEN** the user clicks `Clear`
- **THEN** the action bar is removed and selection is empty

#### Scenario: Move up/down buttons disabled at boundaries
- **GIVEN** the selection contains the topmost row
- **THEN** `Move ↑` is disabled
- **AND GIVEN** the selection contains the bottommost row
- **THEN** `Move ↓` is disabled

#### Scenario: Move up/down only enabled on contiguous selection
- **GIVEN** the selection is non-contiguous (e.g. indexes `[1, 4]`)
- **THEN** both `Move ↑` and `Move ↓` buttons are disabled

#### Scenario: Paste-after enabled only when clipboard non-empty and a single hover/focus target exists
- **GIVEN** the row clipboard has content
- **AND** exactly one row has hover or keyboard focus
- **THEN** `Paste after target` is enabled
- **OTHERWISE**
- **THEN** the button is disabled

### Requirement: Internal row clipboard with insert-after paste

The state SHALL hold a single internal row clipboard `clipboard: string[]` of canonical lines. `Copy` SHALL write the canonical lines at `selected.indexes` (in index order) into the clipboard without mutating the canonical string. `Cut` SHALL copy then delete the selected lines. `Paste after target(N)` SHALL splice the clipboard contents into the canonical string starting at position `N + 1`, without overwriting any existing line. After paste, the selection SHALL contain the indexes of the newly inserted rows.

#### Scenario: Copy then paste-after inserts without overwriting
- **GIVEN** the canonical has 5 lines and the user selects rows 1 and 2
- **WHEN** the user copies and then pastes after row 4
- **THEN** the canonical has 7 lines, the original lines 0..4 are unchanged, and lines 5 and 6 are byte-identical copies of the original lines 1 and 2

#### Scenario: Cut moves lines from the canonical to the clipboard
- **GIVEN** the canonical is `"a\nb\nc\nd"` and the user selects rows 1 and 2
- **WHEN** the user cuts
- **THEN** the canonical is `"a\nd"` and the clipboard is `["b", "c"]`

#### Scenario: Paste-after at index 0 inserts at the start of position 1
- **GIVEN** the canonical is `"a\nb"` and the clipboard is `["x"]`
- **WHEN** the user pastes after row 0
- **THEN** the canonical is `"a\nx\nb"`

#### Scenario: Paste-after preserves clipboard for repeat paste
- **GIVEN** the user has copied 2 rows
- **WHEN** the user pastes after row 0 then pastes after row 5
- **THEN** both pastes succeed and the clipboard remains the original 2 rows

#### Scenario: OS clipboard not used for row paste
- **WHEN** the user copies rows in this app
- **THEN** the OS clipboard is unchanged

### Requirement: OS-clipboard chord-text copy via kebab menu

The per-row kebab menu SHALL include a `Copy chord text` item. Activating it SHALL write the row's chord string to the OS clipboard using the existing `copy-to-clipboard` library. This is the only operation in the chord-row editor that touches the OS clipboard.

#### Scenario: Copy chord text writes to OS clipboard
- **GIVEN** row 3 has chord `"Am"`
- **WHEN** the user opens the kebab menu and clicks `Copy chord text`
- **THEN** the OS clipboard contains `"Am"`

### Requirement: Per-row affordances are drag handle plus kebab menu

Each row SHALL render exactly one drag handle (leading) and exactly one kebab menu (trailing) for row-level operations. The handle and the menu SHALL be revealed on row hover or row keyboard focus and SHALL be hidden otherwise. No other row-level operation icons SHALL appear in the row strip.

The kebab menu SHALL contain: `Move up`, `Move down`, `Duplicate`, `Delete`, `Copy chord text`.

#### Scenario: Hovering a row reveals handle and menu
- **WHEN** the pointer enters a row
- **THEN** the drag handle and the kebab menu are visible

#### Scenario: Touch user can reach actions without hover
- **GIVEN** a touch device
- **WHEN** the user taps the kebab menu icon (always-rendered with reduced opacity on touch)
- **THEN** the menu opens with all five items

### Requirement: Keyboard support and ARIA listbox semantics

The rows container SHALL have `role="listbox"` and `aria-multiselectable="true"`. Each row SHALL have `role="option"` and a correct `aria-selected`. A roving tabindex SHALL place `tabIndex=0` on the focused row only.

When the listbox container or a row (not an inner input) has focus, the following keyboard shortcuts SHALL be supported:

- `ArrowUp` / `ArrowDown` — move focus
- `Space` — toggle selection of the focused row (mode `'toggle'`)
- `Shift+ArrowUp` / `Shift+ArrowDown` — extend selection to include the focused row (mode `'range'`)
- `Cmd/Ctrl+ArrowUp` / `Cmd/Ctrl+ArrowDown` — move the focused row up / down via swap
- `Cmd/Ctrl+C` / `Cmd/Ctrl+X` / `Cmd/Ctrl+V` — copy / cut / paste-after the focused row
- `Cmd/Ctrl+A` — select all rows
- `Esc` — clear selection
- `Delete` / `Backspace` — delete the selected rows (or the focused row if no selection)

When focus is inside an `INPUT` or `TEXTAREA`, none of the listbox shortcuts SHALL fire — native input behaviour SHALL prevail.

#### Scenario: ArrowDown moves focus down
- **GIVEN** focus is on row 2
- **WHEN** the user presses `ArrowDown`
- **THEN** focus moves to row 3 and `tabIndex` is on row 3

#### Scenario: Cmd+C inside an input does not copy a row
- **GIVEN** focus is inside the chord input on row 2
- **WHEN** the user presses `Cmd+C`
- **THEN** the OS clipboard receives the input's text selection, the row clipboard is unchanged, and the selection state is unchanged

#### Scenario: Cmd+A on the listbox selects all rows
- **GIVEN** focus is on the listbox container or any row
- **WHEN** the user presses `Cmd+A`
- **THEN** every row is selected and `anchor` becomes the focused row index

#### Scenario: Esc clears selection
- **GIVEN** at least one row is selected
- **WHEN** the user presses `Esc` with focus on the listbox or a row
- **THEN** the selection becomes empty and the action bar is hidden

### Requirement: Inline undo via snackbar for destructive bulk operations

`Cut`, `Delete`, `Paste after target`, and any bulk move (move-up or move-down dispatched against more than one row) SHALL push a snackbar with an `Undo` button that auto-dismisses after 5 seconds. Activating `Undo` SHALL restore the canonical string to its prior state and dismiss the snackbar.

#### Scenario: Delete shows snackbar with undo
- **WHEN** the user deletes 3 selected rows
- **THEN** a snackbar appears reading `"Deleted 3 rows"` with an `Undo` button

#### Scenario: Snackbar auto-dismiss
- **WHEN** the snackbar is visible for 5 seconds without interaction
- **THEN** the snackbar is dismissed

#### Scenario: Snackbar undo restores prior canonical
- **GIVEN** a snackbar is visible after a `Cut`
- **WHEN** the user clicks `Undo`
- **THEN** the canonical string is byte-identical to its pre-cut value and the clipboard returns to its pre-cut value

#### Scenario: Single-row move does not snackbar
- **WHEN** the user dispatches `moveDown` on a single focused row (no selection involved)
- **THEN** no snackbar is shown

### Requirement: Stable per-line ids for animation and keying

The state SHALL hold a parallel `lineIds: string[]` array, one id per line in the canonical string. On `setCanonical`, ids SHALL be reused for unchanged or shifted lines via line-by-line diff and minted afresh for new lines. On `replaceLine(N)`, `lineIds[N]` SHALL be re-minted. On every reorder action (`moveUp`, `moveDown`, `moveRow`, `pasteAfter`, `cutSelected`, `deleteSelected`, `duplicateRow`), `lineIds` SHALL be spliced in lockstep with the lines. The row selector SHALL expose the id as `Row.id`. React row keys SHALL use `Row.id`, not row content.

#### Scenario: Reorder preserves ids
- **GIVEN** rows 0..4 have ids `[a, b, c, d, e]`
- **WHEN** the user moves row 0 to position 3
- **THEN** ids become `[b, c, d, a, e]`

#### Scenario: Replace mints new id
- **GIVEN** row 2 has id `c`
- **WHEN** the user replaces line 2 with new chord/lyric content
- **THEN** the row at index 2 has a fresh id distinct from `c`

#### Scenario: Insert mints new id, neighbours preserved
- **GIVEN** rows have ids `[a, b, c]`
- **WHEN** the user duplicates row 1
- **THEN** ids become `[a, b, X, c]` where `X` is a newly minted id distinct from `a, b, c`

### Requirement: Migration via feature flag

The new chord-row interaction model SHALL ship behind a boolean flag `enableNewRowUx` on `AppReducer`, default `false` for the initial landing. The flag SHALL gate the UI rendering choice (new vs. legacy icon strip) and the keyboard-handler attachment. Once the flag is flipped to `true` by default in a follow-up commit, a separate cleanup change SHALL remove the flag and the legacy code paths.

#### Scenario: Flag off renders legacy UI
- **GIVEN** `enableNewRowUx` is `false`
- **THEN** the editor renders the legacy per-row icon strip and the legacy selection model
- **AND** none of the new keyboard shortcuts fire

#### Scenario: Flag on renders new UI
- **GIVEN** `enableNewRowUx` is `true`
- **THEN** the editor renders the drag handle, kebab menu, selection action bar, and listbox keyboard shortcuts
