## Context

The app currently builds the result view and download text by rendering each chord row as a separate line above its corresponding lyric line (chords-over-lyrics). This is one of the two formats OnSong supports. The second format — bracketed inline chords — embeds each chord at its horizontal position inside the lyric line (`[G]Amazing [D]grace`).

The chord data is already structured as parallel arrays: `chords[i]` is a space-padded string of chord tokens aligned over `songText[i]`. Converting to bracketed format is a pure transformation over these two strings.

## Goals / Non-Goals

**Goals:**
- Let users toggle between `chords-over-lyrics` and `bracketed` export format in the result view.
- Apply the selected format to both the visual preview and the downloaded file.
- Implement a pure, unit-testable formatter for bracketed output.

**Non-Goals:**
- Parsing bracketed input (import direction).
- Changing editor behavior, chord entry, transposition, or key detection.
- Persisting the format preference beyond the current session.

## Decisions

### 1. Format state lives in AppReducer

The selected format is UI/session state — it doesn't change the underlying song data. `AppReducer` already owns analogous UI state (`showResult`). Adding `onsongFormat: 'chords-over-lyrics' | 'bracketed'` there keeps song data pure.

_Alternative: ChordSheetReducer_ — rejected; format selection is a presentation concern, not a song concern.

### 2. New `src/lib/onsong/` module for formatters

A dedicated module isolates the format logic and makes it independently testable. It exposes two functions:
- `formatChordsOverLyrics(chordLine, lyricLine): string[]` — returns `[chordLine, lyricLine]` (current behaviour, extracted).
- `formatBracketed(chordLine, lyricLine): string` — inserts `[Chord]` tokens at the character positions derived from the chord line's whitespace layout.

A thin `formatChordSheet(format, chords, songLines): string` entry point assembles the full output string for both the preview and the download.

_Alternative: inline logic in ChordSheetResult_ — rejected; untestable, mixes concerns.

### 3. Bracketed position algorithm

The chord line `"G       D        Em    C   "` encodes horizontal positions. The algorithm:

1. Scan the chord line left-to-right; collect `{offset, token, type}` triples by finding runs of non-space characters.
2. Classify each token:
   - Matches `(…)` where the inner text is a chord → **optional chord** (`([chord]]` in output).
   - Matches `|`, `||`, `||:`, `:||` → **bar separator** (inserted as-is, no brackets).
   - Otherwise → **chord** (wrapped in `[…]`).
3. Walk the lyric line inserting each formatted token at its offset, adjusting for previously inserted characters.
4. If the lyric line is shorter than a token's offset, pad with spaces before inserting.

This mirrors how musicians read tab sheets — the chord sits directly above the syllable it starts on.

### 4. Toggle UI — styled checkbox/toggle in ResultButtons

A simple accessible `<label>` + `<input type="checkbox">` toggle labelled "Bracketed chords" is placed beside the existing Edit/Download buttons. It dispatches `setOnsongFormat`. No extra dependency needed.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Chord column offset overshoots lyric length | Pad lyric with spaces before inserting bracket |
| Multi-byte or combining characters shift offsets | Limit to ASCII content (current chord entry is ASCII-only); document as known limitation |
| Chord-only rows (no lyric) in bracketed mode | Wrap each chord token in brackets, keep bar separators and optional-chord parens as-is |
| Blank chord rows in bracketed mode | Emit the lyric line unchanged |
| Consecutive instrumental rows would produce consecutive blank lines | `formatChordSheet` suppresses the blank line between instrumental rows; a blank line is still emitted when transitioning from an instrumental row to a lyric row |
