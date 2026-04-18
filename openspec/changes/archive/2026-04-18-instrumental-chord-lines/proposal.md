## Why

The chord-line classifier only accepts whitespace-separated chord tokens. Pasted charts that include instrumental bar notation (`| G | D | Em | C |`, `|: G D :|`, `| G / / / | D / / / |`, `[G] [D]`) are misclassified as lyric lines — the user has to manually re-enter the chords for every instrumental section.

The classifier already has two adjacent helpers that are *over*-tolerant: `transpose()` transposes chord tokens inside arbitrary text, and `parseChords()` drops non-chord tokens silently. The only real blocker is the regex gate in `isChordsOnly`.

## What Changes

- Widen the chord-line classifier so lines mixing chords with instrumental punctuation (`|`, `[`, `]`, `:`, `/`, `(`, `)`) and common trailing punctuation (`,`, `.`) are recognised as chord lines.
- Guard against false positives with the invariant: every alphabetic word in the line MUST match the chord regex; any non-chord word (e.g. `Verse`, `Intro`) drops the line back to the lyric bucket.
- Stop auto-inserting a blank lyric line between adjacent chord-only lines in `parseChordsAndSongText` — respect the whitespace the user actually pasted.
- Hide the per-row lyric input in the editor when the row is an instrumental row (derived: chord row contains instrumental punctuation AND paired lyric is empty).
- Update the bracketed OnSong formatter so instrumental lines preserve the user's original spacing (`| [G] | [D] | [Em] | [C] |`) instead of concatenating tokens.

## Capabilities

### New Capabilities

- `chord-classifier`: The rule and token algorithm for deciding whether a single line counts as a chord line, including instrumental punctuation.
- `instrumental-row-rendering`: Editor UX rule — a row whose chord content is instrumental-shaped and whose paired lyric is empty renders only the chord input.

### Modified Capabilities

- `onsong-bracketed-formatter`: Instrumental lines preserve inter-token spacing instead of concatenating.
- `song-text-separator` (implicit): no longer inserts a synthetic blank lyric line between adjacent chord-only lines.

## Impact

- `src/lib/chord/isChordsOnly.ts` — new classifier implementation (regex alone is insufficient; a two-pass token scan is clearer).
- `src/lib/songTextChordsSeparator/index.ts` — remove the auto-blank-between-adjacent-chord-rows branch.
- `src/container/ChordSheetEditor/ChordSheetRow/index.tsx` — hide lyric input for instrumental rows.
- `src/lib/onsong/bracketedFormatter.ts` — preserve original spacing when `lyricLine` is empty.
- Unit tests: `isChordsOnly.spec.ts`, `bracketedFormatter.spec.ts`, new separator tests.
- E2E: one new Playwright test pasting an instrumental chart.
- No changes to `transpose`, `parseChords`, `findKey`, or Redux state shape.
