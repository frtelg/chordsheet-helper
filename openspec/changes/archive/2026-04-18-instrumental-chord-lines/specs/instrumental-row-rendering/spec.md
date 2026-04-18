## ADDED Requirements

### Requirement: Editor hides lyric input for instrumental rows
The editor SHALL detect an instrumental row and render only the chord input (no lyric input) for that row. The detection is derived from existing state, not stored explicitly.

A row is considered instrumental when BOTH hold:
- The chord row content contains any instrumental punctuation character (`|`, `[`, `]`, `:`, `(`, `)`) OR a standalone `/` token (surrounded by whitespace or line boundaries).
- The paired lyric line at the same index is empty or whitespace-only.

#### Scenario: Bar-separated chord row with empty lyric
- **WHEN** the chord row is `"| G | D | Em | C |"` and the paired lyric line is empty
- **THEN** only the chord input is rendered for that row
- **THEN** no lyric input is rendered beside or below it

#### Scenario: Normal chord row with lyric
- **WHEN** the chord row is `"G D Em C"` and the paired lyric line is `"Amazing grace how sweet"`
- **THEN** both chord input and lyric input are rendered (existing behaviour)

#### Scenario: Instrumental-shaped chord row with manually-typed lyric
- **WHEN** the chord row is `"| G | D |"` and the user types `"Intro hook"` into the lyric input
- **THEN** the row is no longer considered instrumental
- **THEN** the lyric input remains visible

#### Scenario: Chord row with no instrumental punctuation
- **WHEN** the chord row is `"G D"` and the paired lyric line is empty
- **THEN** the row is NOT considered instrumental
- **THEN** the lyric input is rendered (empty)

### Requirement: Pasting consecutive chord lines preserves user-supplied spacing
The paste-to-editor pipeline SHALL NOT insert synthetic blank lines between adjacent chord-only lines. A blank line between chord lines SHALL be preserved only if the pasted input contained one.

#### Scenario: Adjacent chord lines with no blank between them
- **WHEN** the pasted input contains two chord lines on consecutive source lines
- **THEN** the editor produces two chord rows with no synthetic blank row inserted between them

#### Scenario: Adjacent chord lines separated by a blank in the source
- **WHEN** the pasted input contains a chord line, a blank line, and another chord line
- **THEN** the editor preserves the blank line between the two chord rows
