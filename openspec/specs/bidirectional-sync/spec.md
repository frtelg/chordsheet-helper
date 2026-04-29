## ADDED Requirements

### Requirement: Single canonical chord sheet string

The system SHALL store the chord sheet as a single Redux string in OnSong bracketed format. Both the left textarea and the right per-row editor SHALL read from and write to that single string. No parallel chord array or separate lyric string SHALL exist as a co-canonical source.

#### Scenario: Right-side chord edit updates left textarea
- **GIVEN** the canonical string is `"I once was lost"`
- **WHEN** the user edits the chord on row 1 to `Am` via the right-side editor
- **THEN** the canonical string becomes `"I [Am]once was lost"` and the left textarea reflects that value

#### Scenario: Left textarea edit updates right-side rows
- **GIVEN** the canonical string is `"[Am]love"`
- **WHEN** the user types `" me"` at the end of the lyric in the left textarea
- **THEN** the canonical string becomes `"[Am]love me"` and the right-side row 1 shows chord `Am` and lyric `love me`

#### Scenario: Adding a new line on the left classifies it
- **GIVEN** the canonical string is `"[Am]love"`
- **WHEN** the user presses Enter and types `"[G] [D]"` on a new line in the left textarea
- **THEN** the new line is classified as an instrumental row and rendered as a chord-only row in the right-side editor

### Requirement: Live left-edit reparse

The left textarea SHALL dispatch every keystroke as a `setCanonical` action. Downstream selectors SHALL reparse the canonical string on demand and SHALL be memoised on canonical-string identity so that unchanged renders trigger no recomputation.

#### Scenario: Selector memoises across identical dispatches
- **GIVEN** the canonical string has not changed
- **WHEN** the row selector is read multiple times
- **THEN** the second and subsequent reads return the same `Row[]` reference as the first

### Requirement: Right-side edit splices a single bracketed line

A right-side edit SHALL dispatch `replaceLine({ index, chord, lyric })` where `index` is the line index in the canonical string. The reducer SHALL rebuild that single line via `formatBracketedLine(chord, lyric)`, splice it into the line array, and rejoin. Other lines SHALL not be modified.

#### Scenario: Edit row N leaves rows N-1 and N+1 unchanged
- **GIVEN** the canonical string has 5 lines
- **WHEN** the user dispatches `replaceLine({ index: 2, chord: 'Bm', lyric: 'love' })`
- **THEN** lines 0, 1, 3, 4 are byte-identical to before and line 2 is the bracketed render of `(Bm, love)`

### Requirement: Cursor preservation in left textarea

When a right-side edit changes the canonical string while the textarea is not focused or while focus origin is `'right'`, the left textarea's cursor position SHALL be preserved at its last left-side position. When the user is actively typing in the left textarea, the textarea SHALL behave as a normal controlled input.

#### Scenario: Right-side edit while left textarea has cursor at position 5
- **GIVEN** the user has clicked into the left textarea and placed the cursor at character offset 5
- **WHEN** the user clicks into a right-side chord input and changes it
- **THEN** after the canonical string updates, the left textarea cursor remains at character offset 5 (or the equivalent valid position if the string shortened)

### Requirement: Forbidden literal `[` in lyrics

The system SHALL reject any edit that introduces a literal `[` character in lyric text outside a valid `[chord]` token. The rejection SHALL revert the textarea to its prior value and SHALL surface a small inline warning to the user.

#### Scenario: Typing `[` in a lyric word
- **WHEN** the user types `[` in the middle of the lyric `"love"` so that the line would become `"l[ove"`
- **THEN** the edit is reverted and an inline warning indicates that `[` is not allowed in lyrics

#### Scenario: Typing `[Am]` is allowed
- **WHEN** the user types `[Am]` at the start of a lyric word
- **THEN** the edit is accepted and the canonical string includes the `[Am]` token

### Requirement: Instrumental row classification

The parser SHALL derive instrumental rows from the canonical string using two complementary rules.

**Rule A (chord-only paired row):** A canonical line that satisfies the chord-classifier (`isChordsOnly`) SHALL produce a `Row` with `chord = <line content>`, `lyric = ''`, `isInstrumental: true`. The right-side editor SHALL render that row with the lyric input hidden (per the existing `instrumental-row-rendering` capability). The chords-over-lyrics rendering SHALL print the chord row above an empty lyric line.

**Rule B (empty-line silent rest):** A maximal run of `N` consecutive empty lines flanked by non-empty content on both sides SHALL produce `max(0, N − 2)` silent-rest rows (`chord = ''`, `lyric = ''`, `isInstrumental: true`). The first and last empty lines of the run are separators and SHALL NOT produce rows. At the start or end of the sheet, the missing flanking content counts as a separator: a leading or trailing run of `N` empties produces `max(0, N − 1)` rows. A run of empties that constitutes the entire sheet produces `N` rows.

**Composition:** Rule A and Rule B compose line-by-line. A chord-only line embedded inside a region of empties consumes its own line index; the empties around it are classified per Rule B around the chord-only line.

#### Scenario: Two empty lines between lyric blocks
- **WHEN** the canonical string is `"lyric\n\n\nlyric"` (3 empties)
- **THEN** the parser produces three rows: lyric, one silent-rest, lyric

#### Scenario: One empty line between lyric blocks
- **WHEN** the canonical string is `"lyric\n\nlyric"` (2 empties)
- **THEN** the parser produces two rows: lyric, lyric (both empties are separators)

#### Scenario: Single empty line
- **WHEN** the canonical string is `"lyric\nlyric"` with one empty between (`"lyric\n\nlyric"` is the same; `"lyric\nlyric"` is none)
- **THEN** zero silent-rest rows are produced

#### Scenario: Four empties between lyric blocks
- **WHEN** the canonical string is `"lyric\n\n\n\n\nlyric"` (4 empties)
- **THEN** the parser produces four rows: lyric, silent-rest, silent-rest, lyric

#### Scenario: Chord-only line as paired row
- **WHEN** the canonical string is `"[G] [D]"`
- **THEN** the parser produces one row with `chord = "[G] [D]"`, `lyric = ""`, `isInstrumental: true`

#### Scenario: Chord-only line surrounded by separators
- **WHEN** the canonical string is `"lyric\n\n[G] [D]\n\nlyric"`
- **THEN** the parser produces three rows: lyric, chord-only paired row (empty lyric), lyric. The two blank lines flanking `[G] [D]` are separators and produce no rows.

#### Scenario: Silent rest plus chord-only line
- **WHEN** the canonical string is `"lyric\n\n\n[G] [D]\n\nlyric"`
- **THEN** the parser produces four rows: lyric, silent-rest, chord-only paired row, lyric

#### Scenario: Sheet starts with a chord-only line then a separator
- **WHEN** the canonical string is `"[G] [D]\n\nlyric"`
- **THEN** the parser produces two rows: chord-only paired row, lyric. The single blank is the trailing separator; the start-of-sheet acts as the leading separator.

#### Scenario: Sheet starts with a chord-only line then a silent rest
- **WHEN** the canonical string is `"[G] [D]\n\n\nlyric"`
- **THEN** the parser produces three rows: chord-only paired row, silent-rest, lyric

#### Scenario: Silent-rest row renders as a blank row
- **WHEN** the right-side editor renders a silent-rest row
- **THEN** the row appears with no chord input value and no lyric input value (no placeholder, no marker)

### Requirement: Unified undo

The system SHALL maintain a single undo history for the canonical string. Both left-side and right-side mutations SHALL push to the same history stack. `undo` SHALL pop the stack and restore the prior canonical string.

#### Scenario: Undo crosses edit sources
- **GIVEN** the user typed a lyric on the left, then changed a chord on the right
- **WHEN** the user invokes undo twice
- **THEN** the canonical string returns to its state before the lyric edit

### Requirement: Test coverage

Every public function introduced by this change SHALL have unit tests covering its specified behaviour. The user-visible bidirectional sync flow SHALL have at least one Playwright happy-path test that exercises typing on both sides, format toggling, and transpose.

#### Scenario: Unit coverage
- **WHEN** the unit test suite runs
- **THEN** the parser, the canonical reducer actions, the bracketed-line writer, the selectors, the format-toggle parser/renderer, and the cursor-preservation hook each have direct unit tests

#### Scenario: End-to-end coverage
- **WHEN** the Playwright suite runs
- **THEN** at least one test types lyrics on the left, adds a chord on the right, asserts the bracketed canonical string in the left textarea, toggles the format selector, and transposes
