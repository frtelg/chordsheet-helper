## Why

The left lyrics textarea and the right chord sheet editor are out of sync. Edits made on the right (chord input, lyric input per row) update Redux but never reflect back into the left textarea, which keeps showing the lyrics-only string the user originally pasted. Users cannot see their work as a single document, and any chord they add on the right is invisible to a copy-paste of the left input.

The two views also use two different sources of truth (`songText.value` for lyrics, `chordSheet.value[]` for chords). Adding a third view or toggling format would compound the drift.

## What Changes

- Promote the canonical chord sheet to a single Redux string in OnSong bracketed format (`I [Am]once was [G]lost`). Both views read from and write to that string.
- Make the left textarea a live editor of the canonical string. Every keystroke dispatches the new value; line-level reparse classifies each line as chord, lyric, or instrumental.
- Make right-side edits emit bracketed-line replacements into the canonical string. The left textarea re-renders on every right-side edit, with cursor preservation when focus is not in the textarea.
- Add a render-only format toggle (`Bracketed | Chords-over-lyrics`) above the left textarea. Storage stays bracketed; the toggle picks the rendered/parsed view. Default: bracketed.
- Drop `chordSheet.value` from Redux. Replace with a memoised selector that derives `{ chord, lyric, isInstrumental }[]` from the canonical string. All existing readers (transpose, key detect, row editor, OnSong export) read from the selector.
- Forbid literal `[` in lyric text (no escape mechanism in v1). Document and enforce via parser.
- Preserve existing paste flow: `ProcessChordLinesModal` still triggers on legacy chords-over-lyrics paste, but the converter now writes a bracketed canonical string rather than two parallel arrays.

## Capabilities

### New Capabilities

- `bidirectional-sync`: The contract that the left textarea and the right per-row editor read from and write to a single canonical bracketed-OnSong string, with live reparse on left edits and bracketed-line splice on right edits.
- `editor-format-toggle`: The render-only toggle above the left textarea that switches between bracketed and chords-over-lyrics presentation without changing storage.

### Modified Capabilities

- `onsong-bracketed-formatter`: Becomes the canonical storage format, not just an export format. Round-trip parse → format → parse must be idempotent on every accepted input.
- `chord-classifier`: Used live during left-textarea typing to classify each edited line. Same rules; new caller.
- `song-text-separator` (implicit): Output target changes from two parallel arrays to a single bracketed string.

## Impact

- `src/redux/reducer/ChordSheetReducer.ts` — drop `value: string[]` and `history: string[][]`; rewire actions (`setChords`, `transposeAll`, `moveUp`, `moveDown`, `pasteSelected`, `undo`, `resetChords`) to mutate the canonical string slice instead.
- `src/redux/reducer/SongTextReducer.ts` — rename to canonical store; add `history: string[]` for unified undo; expose action `replaceLine(index, line)` for right-side edits.
- New `src/redux/selectors/canonicalRows.ts` — memoised selector returning `{ chord, lyric, isInstrumental }[]` plus `chordTokens()` for transpose and key detect.
- `src/container/SongTextInput/index.tsx` — left textarea reads from canonical store; live `onChange` dispatch; cursor-preservation `useLayoutEffect`; format-toggle integration.
- `src/container/ChordSheetEditor/index.tsx` and `ChordSheetRow/index.tsx` — replace `useSelector(chords)` with row selector; right-side edits dispatch `replaceLine`.
- `src/container/ChordSheetEditor/Transposer/index.tsx` — read from selector, dispatch transpose action that rewrites bracket contents in place.
- `src/lib/onsong/bracketedFormatter.ts` — promote to canonical writer used by paste import and right-side row edits.
- New `src/lib/onsong/bracketedParser.ts` — string → row array, with line classifier reuse.
- `src/lib/songTextChordsSeparator/index.ts` — output target changes to single bracketed string.
- New unit tests for: parser (every accepted line shape, every rejection), selector memoisation, line-level reparse, right-side splice, cursor preservation.
- E2E happy-path test: type lyrics on left, add chord on right, observe bracketed text in left textarea; toggle format, observe rendered switch; transpose, observe both views update.
- No changes to chord parsing (`parseChord`, `parseChords`), key detection logic itself (`findKey`), or the OnSong export view (still consumes the same canonical string).
