## MODIFIED Requirements

### Requirement: Bracketed OnSong is the canonical editor storage format

The bracketed OnSong format SHALL serve as the canonical Redux storage format for the chord sheet, not only as an export format. The formatter SHALL expose `formatBracketedLine(chord: string, lyric: string) => string` for single-line emission used by right-side row edits, in addition to the existing whole-sheet `formatBracketed`.

#### Scenario: Single-line emission for a paired row
- **WHEN** `formatBracketedLine('Am', 'love')` is called
- **THEN** the output is `"[Am]love"`

#### Scenario: Single-line emission for an instrumental row
- **WHEN** `formatBracketedLine('| G | D |', '')` is called
- **THEN** the output preserves the instrumental spacing, e.g. `"| [G] | [D] |"`

#### Scenario: Single-line emission for a pure lyric row
- **WHEN** `formatBracketedLine('', 'love me')` is called
- **THEN** the output is `"love me"`

### Requirement: Idempotent round-trip with the bracketed parser

The bracketed parser and the bracketed formatter SHALL be a round-trip pair. For every canonical string `s` accepted by the parser, `formatBracketed(parseCanonical(s)) === s`.

#### Scenario: Parse-format round-trip
- **WHEN** a corpus of accepted canonical strings is fed through `formatBracketed(parseCanonical(s))`
- **THEN** the result equals the original `s` for every input
