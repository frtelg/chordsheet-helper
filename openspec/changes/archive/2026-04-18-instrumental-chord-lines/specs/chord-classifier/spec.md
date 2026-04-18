## ADDED Requirements

### Requirement: Classifier recognises instrumental notation as chord lines
The system SHALL classify a pasted or entered line as a "chord line" when every alphabetic word in the line matches the chord regex AND every character in the line belongs to the allowed set: word characters (`A-Za-z0-9#♭♯`), whitespace, instrumental punctuation (`|`, `[`, `]`, `:`, `/`, `(`, `)`), or common trailing punctuation (`,`, `.`).

The classifier SHALL return false when any word in the line fails the chord regex, OR when any character falls outside the allowed set.

The classifier SHALL return false for a line that contains no alphabetic words (e.g. whitespace-only, punctuation-only).

#### Scenario: Bar-separated chord line
- **WHEN** the input line is `"| G | D | Em | C |"`
- **THEN** the classifier returns true

#### Scenario: Repeat-bar instrumental line
- **WHEN** the input line is `"|: G D Em C :|"`
- **THEN** the classifier returns true

#### Scenario: Rhythm slashes inside bars
- **WHEN** the input line is `"| G / / / | D / / / |"`
- **THEN** the classifier returns true

#### Scenario: Bracketed chord line
- **WHEN** the input line is `"[G] [D] [Em] [C]"`
- **THEN** the classifier returns true

#### Scenario: Optional chord notation
- **WHEN** the input line is `"(Am) G D"`
- **THEN** the classifier returns true

#### Scenario: Plain chord line with slash-bass chords
- **WHEN** the input line is `"Fsus4 F Bb2/D"`
- **THEN** the classifier returns true

#### Scenario: Lyric line containing colon and chord names
- **WHEN** the input line is `"Verse 1: G D Em C"`
- **THEN** the classifier returns false (`Verse` is not a chord)

#### Scenario: Section header with only non-chord word
- **WHEN** the input line is `"[Intro]"`
- **THEN** the classifier returns false (`Intro` is not a chord)

#### Scenario: Section header mixed with chords
- **WHEN** the input line is `"[Chorus] G D"`
- **THEN** the classifier returns false (`Chorus` is not a chord)

#### Scenario: Chord line with comma and period punctuation
- **WHEN** the input line is `"G, D, Em, C."`
- **THEN** the classifier returns true (every word is a chord; `,` and `.` are allowed)

#### Scenario: Lyric line with comma and period punctuation
- **WHEN** the input line is `"Hello, world."`
- **THEN** the classifier returns false (`Hello` and `world` are not chords)

#### Scenario: Whitespace-only line
- **WHEN** the input line is empty or whitespace-only
- **THEN** the classifier returns false

#### Scenario: Punctuation-only line
- **WHEN** the input line is `"| | |"`
- **THEN** the classifier returns false (no chord content)

### Requirement: Classifier behaviour is covered by unit and end-to-end tests
Every scenario in this specification SHALL have a corresponding unit test in `src/lib/chord/isChordsOnly.spec.ts`. At least one Playwright E2E test SHALL exercise the full paste-to-editor flow with an input that contains instrumental-notation chord lines alongside lyric lines, verifying both the row classification and the downstream editor rendering.

#### Scenario: Unit test coverage
- **WHEN** the unit test suite runs
- **THEN** `isChordsOnly.spec.ts` contains a test asserting each scenario listed in this requirement

#### Scenario: End-to-end coverage
- **WHEN** the Playwright suite runs
- **THEN** at least one test pastes a chart containing instrumental-notation chord lines (e.g. `| G | D | Em | C |`) and verifies they appear as chord rows with no lyric input beside them
