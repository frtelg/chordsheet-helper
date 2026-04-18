## ADDED Requirements

### Requirement: Bracketed formatter converts (chordLine, lyricLine) to a single inline string
The system SHALL provide a pure function `formatBracketed(chordLine: string, lyricLine: string): string` that inserts each chord token from `chordLine` into `lyricLine` at the corresponding character offset, wrapped in square brackets.

The formatter SHALL recognise three token types when scanning the chord line:
- **Chord token** — one or more non-space characters that form a valid chord name (e.g. `Am`, `Gmaj7`). These are wrapped in `[…]`.
- **Optional chord token** — a chord name surrounded by round brackets (e.g. `(Am)`). The outer round brackets are preserved and the chord inside is also wrapped in square brackets: `([Am])`.
- **Bar separator token** — `|`, `:||`, `||:`, or `||`. These are inserted at their column position without any square brackets.

#### Scenario: Single chord at position zero
- **WHEN** `chordLine` is `"G"` and `lyricLine` is `"Amazing grace"`
- **THEN** the result is `"[G]Amazing grace"`

#### Scenario: Multiple chords at various positions
- **WHEN** `chordLine` is `"G       D"` and `lyricLine` is `"Amazing grace"`
- **THEN** the result is `"[G]Amazing [D]grace"`

#### Scenario: Chord position exceeds lyric length
- **WHEN** `chordLine` is `"G            D"` and `lyricLine` is `"Amen"`
- **THEN** the lyric is padded with spaces so `[D]` is inserted at offset 13
- **THEN** the result is `"[G]Amen         [D]"`

#### Scenario: Optional chord in round brackets
- **WHEN** `chordLine` is `"(Am)    G"` and `lyricLine` is `"Amazing grace"`
- **THEN** the result is `"([Am])Amazing [G]grace"`

#### Scenario: Bar separator inserted at its column offset
- **WHEN** `chordLine` is `"Am  |   G"` (Am at col 0, `|` at col 4, G at col 8) and `lyricLine` is `"Amazing grace"`
- **THEN** `|` is inserted before the character at original offset 4 (`i` in "Amazing") without square brackets
- **THEN** the result is `"[Am]Amaz|ing [G]grace"`

#### Scenario: Repeat sign tokens preserved without brackets
- **WHEN** `chordLine` contains `||:` or `:||`
- **THEN** those tokens are inserted at their column positions without square brackets

#### Scenario: Empty chord line
- **WHEN** `chordLine` is empty or whitespace-only
- **THEN** the result is `lyricLine` unchanged

#### Scenario: Instrumental line — chords without a lyric
- **WHEN** `lyricLine` is empty or whitespace-only and `chordLine` has chord tokens
- **THEN** the chord tokens are each wrapped in square brackets (e.g. `"G   D"` → `"[G][D]"`)
- **THEN** optional chords become `([chord])` and bar separators are kept as-is

### Requirement: Full chord sheet formatted as a single string
The system SHALL provide a function `formatChordSheet(format: OnsongFormat, chords: string[], songLines: string[]): string` that assembles the complete output for either format.

#### Scenario: Chords-over-lyrics output
- **WHEN** `format` is `'chords-over-lyrics'`
- **THEN** each row with chords contributes two lines: the chord line, then the lyric line
- **THEN** rows without chords contribute a single lyric line

#### Scenario: Bracketed output
- **WHEN** `format` is `'bracketed'`
- **THEN** each row with chords and a non-empty lyric contributes a single bracketed line
- **THEN** rows without chords contribute a single plain lyric line
- **THEN** instrumental rows (chords present, lyric empty) contribute a single bracketed chord line

#### Scenario: Consecutive instrumental rows — no blank line between them
- **WHEN** two or more consecutive rows have chords but empty lyrics (instrumental rows)
- **THEN** no blank line is emitted between them in either format
- **THEN** a blank line IS emitted between an instrumental row and the next non-instrumental row (normal song section separation)

#### Scenario: Single instrumental row between lyric sections
- **WHEN** a single instrumental row appears between two lyric sections
- **THEN** it is emitted without adding extra blank lines relative to surrounding rows
