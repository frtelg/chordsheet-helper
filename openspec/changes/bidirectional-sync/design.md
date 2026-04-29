## Context

Today the editor splits state across two slices:

- `songText.value: string` — raw lyric lines, separated by `\n`.
- `chordSheet.value: string[]` — chord per row, parallel-indexed to lyric lines.

The right-side editor writes both. The left-side textarea writes only `songText.value`. The left view never sees chords. Two sources of truth, one-way pipe, drift baked in.

The app also already supports an OnSong bracketed export (`src/lib/onsong/bracketedFormatter.ts`) and a chord-classifier (`src/lib/chord/isChordsOnly.ts`) tolerant of instrumental punctuation. These two pieces are exactly what a single canonical string needs, so the change is mostly plumbing rather than new music-theory code.

## Goals / Non-Goals

**Goals:**
- One canonical string in Redux holds both chords and lyrics.
- Left textarea is a live editor of that string.
- Right-side per-row edits flow back into the same string.
- Format toggle on the left affects rendering only, never storage.
- All existing features (transpose, key detect, OnSong export, undo, row select/move/paste, instrumental rows, paste-with-modal) keep working with no observable behaviour change beyond the new sync.
- Every new function gets unit tests; the user-visible flow gets at least one E2E happy path.

**Non-Goals:**
- Inline chord-position editing within a lyric line via clicks/drags. Right side keeps its current "edit a chord row as a string" UX.
- Escape mechanism for literal `[` in lyrics. Forbidden in v1; documented.
- Persisting the format toggle across sessions. UI state only.
- Migrating any persisted user data. App has no persistence today.
- Rich text, syntax highlighting, or chord autocomplete in the left textarea.

## Decisions

### 1. Canonical storage = OnSong bracketed string

State shape:

```ts
interface CanonicalState {
    value: string;        // bracketed OnSong, e.g. "I [Am]once was [G]lost\n[D] [G]"
    history: string[];    // unified undo for both edit sources
}
```

`chordSheet.value: string[]` is removed. The slice itself can be kept for non-string-derived UI state (selected rows, key) or merged into the canonical slice. We will merge: one slice, one history, one set of actions.

Reasons:
- Single source of truth eliminates drift by construction.
- Bracketed format is positional inside a line, so the chord/lyric pairing is encoded in the string, not in two parallel arrays. No alignment bugs.
- The OnSong format already exists in the codebase; promoting it to canonical reuses the formatter.

_Alternative: keep both slices and synchronise via a middleware._ Rejected. Two writers, two readers, action ordering matters, undo gets ambiguous. Single store removes the entire class.

### 2. Right side reads via memoised selector

```ts
// src/redux/selectors/canonicalRows.ts
export const selectRows = createSelector(
    (s: RootState) => s.canonical.value,
    parseCanonical, // returns Row[]
);

export const selectChordTokens = createSelector(
    selectRows,
    (rows) => rows.flatMap(r => extractChords(r.chord))
);

interface Row {
    chord: string;          // chord-only line as string, e.g. "[Am] [G]" or "" for pure-lyric rows
    lyric: string;          // lyric-only string, "" for instrumental rows
    isInstrumental: boolean;
    sourceLineIndex: number; // index in canonical string's `\n` split
}
```

Reasel via `reselect` (already a transitive dep of Redux Toolkit). Memoised on the canonical string identity, so unchanged renders pay zero cost.

### 3. Right-side edit = bracketed-line splice

Per-row edit (chord changed in row N) dispatches a single action:

```ts
replaceRow({ index: N, chord: 'Bm', lyric: 'love' })
```

Reducer:
1. Splits `state.value` by `\n`.
2. Rebuilds line N from `(chord, lyric)` via `formatBracketedLine(chord, lyric)`.
3. Joins, sets `state.value`.
4. Pushes prior value to `history`.

The reducer does not know about row indices into `Row[]` — it only knows line indices into the canonical string. The selector exposes `sourceLineIndex` so the row component can dispatch the correct line index.

### 4. Live left edit = full-string dispatch + line-level reparse

`onChange` of the textarea dispatches `setCanonical(newString)`. The selector reparses lazily on next read. Reparse is a per-line classify-and-bracket-extract pass; cost is O(lines) and trivially below 1 ms for sheets of any practical size. No debounce needed.

Reasel guarantees only changed-result lines trigger downstream React updates because row identities use `sourceLineIndex` plus the line content as the React `key`.

### 5. Cursor preservation on left

When a right-side edit changes the canonical string, the controlled `<textarea>` re-renders with a new `value`. React's controlled-input behaviour resets `selectionStart` to the end of the value. Mitigation:

```ts
const ref = useRef<HTMLTextAreaElement>(null);
const lastCursor = useRef<{ start: number; end: number } | null>(null);
const focusOrigin = useRef<'left' | 'right' | null>(null);

useLayoutEffect(() => {
    if (focusOrigin.current === 'right' && lastCursor.current && ref.current) {
        ref.current.setSelectionRange(lastCursor.current.start, lastCursor.current.end);
    }
}, [valueFromStore]);
```

The right-side handlers set `focusOrigin.current = 'right'` before dispatching; the left textarea sets `'left'` on focus. Cursor position is captured on every left keystroke into `lastCursor`. Simple, no library, no perceptible jitter.

### 6. Format toggle is render-only

UI state lives in the editor component (`useState`), not Redux. Two pieces:

- Renderer: `(canonicalString) → renderedString` for the textarea `value`. Bracketed mode = identity. Chords-over-lyrics mode = call existing chords-over-lyrics formatter on the parsed rows.
- Parser: `(renderedString, mode) → canonicalString` on `onChange`. Bracketed mode = identity. Chords-over-lyrics mode = call `parseChordsAndSongText`-style logic and re-emit bracketed.

The parser must round-trip: `parse(render(s)) === s` for every accepted canonical `s`. Tested explicitly.

Toggle placement: segmented control directly above the left textarea, as a small toolbar. Decision rationale captured in the `editor-format-toggle` capability spec; final visual treatment to be confirmed via /frontend-design at apply time.

### 7. Forbidden character: `[` in lyrics

The bracketed parser treats `[` as the start of a chord token. A lyric containing a literal `[` would corrupt the canonical string. Two enforcement points:

- Left textarea `onChange`: if the new line introduces a `[` that is not part of a valid `[chord]` token, reject the edit (revert to previous value, optionally surface a small inline warning).
- Right-side lyric input: same validation on blur.

This is a v1 simplification. An escape syntax (`\[`) can be added later behind a small parser change if real users hit it.

### 8. Transpose, key detect, instrumental rows, undo

- `transposeAll(N)` reducer: scan canonical string for `\[([^\]]+)\]`, transpose each match, splice back. Push to `history`. Key detection runs against the new `selectChordTokens()`.
- Undo: pops `history`, sets `value`. One stack covers both edit sources.

**Instrumental rows** are derived by the parser using two complementary rules:

**Rule A — chord-only line as paired row with empty lyric.** A canonical line that satisfies `isChordsOnly` (e.g. `[G] [D]`, `| [G] | [D] |`) becomes a `Row` with `chord = <line content>`, `lyric = ''`, `isInstrumental: true`. In the chords-over-lyrics rendering, this prints the chord row above an empty lyric line. The right-side editor renders it as a row whose lyric input is hidden (per existing `instrumental-row-rendering` capability).

**Rule B — empty-line silent rest.** Empty lines between non-empty lines are first classified as separators or rests:

- One empty line on each side of an instrumental block (chord-only line OR silent-rest run) is a separator. Separators are NOT rendered as rows.
- Excess empty lines beyond the two separators become silent-rest rows: `Row` with `chord = ''`, `lyric = ''`, `isInstrumental: true`.
- Formula for a run of `N` consecutive empty lines flanked by non-empty content on both sides: `silentRests = max(0, N − 2)`.
- At the start or end of the sheet, the missing side counts as a separator. So a run of `N` empties at the very start (followed by non-empty content) yields `silentRests = max(0, N − 1)` rows; same for end-of-sheet runs. A run of `N` empties in a sheet with no non-empty content at all yields `silentRests = max(0, N)` rows (every empty is a rest).
- A run of empty lines that is itself the entire sheet has no surrounding lyric to separate from; treat all empties as rests.

**Rule A and Rule B compose.** A chord-only line embedded in a run of empties consumes its own line index; surrounding empties are then classified per Rule B around the chord-only line. Example:

| Canonical | Rows produced |
|---|---|
| `lyric\n\n\nlyric` (3 empties) | lyric, silent-rest, lyric (2 separators consumed) |
| `lyric\n\n\n\nlyric` (4 empties) | lyric, silent-rest, silent-rest, lyric |
| `lyric\n\nlyric` (2 empties) | lyric, lyric (both empties are separators) |
| `lyric\n[G] [D]\nlyric` | lyric, chord-only paired row (empty lyric), lyric (no separators because no flanking blanks) |
| `lyric\n\n[G] [D]\n\nlyric` | lyric, chord-only paired row, lyric (both blanks are separators around the chord-only row) |
| `lyric\n\n\n[G] [D]\n\nlyric` | lyric, silent-rest, chord-only paired row, lyric |
| `[G] [D]\n\nlyric` (start of sheet) | chord-only paired row, lyric (start counts as a separator; the one blank is the other separator) |
| `[G] [D]\n\n\nlyric` (start of sheet) | chord-only paired row, silent-rest, lyric |

The parser implements this by walking the line array, tagging each line as `lyric`, `chord-only`, or `empty`, then running a second pass that converts each maximal `empty` run into `(separator, separator, rest, rest, …, separator, separator)` per Rule B with start/end-of-sheet substitutions.

**Right-side rendering of a silent rest:** a row with no chord input value and no lyric input value, visually a blank slot in the editor (no placeholder text, no marker). Existing `instrumental-row-rendering` rules apply for hiding the lyric input.

_Trade-off:_ a user who types two consecutive `\n` between lyric lines gets a paragraph break, not a rest. To get one rest, type three. This is the minimal, learnable rule and matches the user's intent (separators around instrumentals).

### 9. Paste flow

`ProcessChordLinesModal` continues to trigger when the pasted text looks like chords-over-lyrics. The handler now calls a new `chordsOverLyricsToBracketed()` rather than dispatching two separate slices. End state: same canonical string is in Redux either way.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Cursor jumps in the textarea on right-side edits | Cursor-preservation `useLayoutEffect` with focus-origin tracking; explicit unit + E2E test for "type on right, see cursor stay put on left" |
| Live full-string dispatch causes excessive React re-renders | Reselect memo on canonical-string identity; row keys include line content so unchanged rows do not re-render |
| Toggle parser is not perfectly round-trip | Property-style unit tests: for a corpus of accepted bracketed strings, `parse(render(s)) === s` must hold |
| Removing `chordSheet.value` breaks transpose / paste / move actions | Reducer rewrite is mechanical; existing reducer tests get rewritten to drive the canonical string instead |
| Forbidding `[` in lyrics surprises a user | Inline warning when an edit is rejected; documented in README; revisit if it becomes a real complaint |
| Right-side edit action cannot find the correct line index | Selector exposes `sourceLineIndex` per row; row component dispatches with that index, not its array position |
| Migration of existing in-flight user state on deploy | App has no persistence; refresh resets state. No migration needed |

## Open Questions

- Should the format toggle persist across page reloads? Deferred — would require localStorage and is orthogonal to the sync contract.
- Should the cursor-preservation strategy also restore scroll position? Likely yes for long sheets; tracked as a follow-up if jitter is observed during E2E.
- Final visual treatment of the toggle (segmented control vs icon button vs dropdown) is best decided with /frontend-design during apply, not in the spec.
