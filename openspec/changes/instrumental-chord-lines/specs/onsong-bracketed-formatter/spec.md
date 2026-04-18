## MODIFIED Requirements

### Requirement: Bracketed formatter converts (chordLine, lyricLine) to a single inline string
The bracketed formatter SHALL, when the lyric line is empty or whitespace-only, preserve the original chord line's inter-token whitespace in the output. Each chord token is wrapped in `[…]`, optional chords become `([chord])`, and bar separators (`|`, `||`, `||:`, `:||`) are emitted verbatim. The whitespace between tokens in the source chord line SHALL be copied verbatim into the output.

The non-instrumental branch (lyric present) is unchanged — tokens are still inserted into the lyric at their character offsets.

#### Scenario: Bar-separated instrumental line preserves spacing
- **WHEN** `chordLine` is `"| G | D | Em | C |"` and `lyricLine` is empty
- **THEN** the result is `"| [G] | [D] | [Em] | [C] |"`

#### Scenario: Repeat-bar instrumental line
- **WHEN** `chordLine` is `"|: G D :|"` and `lyricLine` is empty
- **THEN** the result is `"|: [G] [D] :|"`

#### Scenario: Rhythm-slash instrumental line
- **WHEN** `chordLine` is `"| G / / / | D / / / |"` and `lyricLine` is empty
- **THEN** the result is `"| [G] / / / | [D] / / / |"`

#### Scenario: Simple multi-chord instrumental line (existing behaviour)
- **WHEN** `chordLine` is `"G   D"` and `lyricLine` is empty
- **THEN** the result is `"[G]   [D]"` (whitespace preserved, each chord bracketed)

#### Scenario: Optional chord in instrumental line
- **WHEN** `chordLine` is `"(Am) G"` and `lyricLine` is empty
- **THEN** the result is `"([Am]) [G]"`
