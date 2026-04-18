## Context

Today `isChordsOnly` is a single regex: `^((\s+)?(chordRegex)(\s+)?)+$`. A line is a chord line iff every whitespace-separated token is a chord. Any punctuation — even the slash-bass `/` that already lives *inside* chord regex for `G/B` — only works because it's part of the chord pattern. Free-standing punctuation disqualifies a line.

Users paste instrumental charts like:

```
| G | D | Em | C |
|: G D Em C :|
| G / / / | D / / / |
[G] [D] [Em] [C]
```

These should classify as chord lines and flow through the existing engine (`transpose`, `parseChords`, `findKey`) which is already punctuation-tolerant.

The constraint: misclassification of common lyric lines (`Verse 1: G D Em C`, `[Intro]`, `[Chorus]`) must not get worse — preferably gets tighter.

## Goals / Non-Goals

**Goals:**
- Recognise instrumental-notation lines as chord lines.
- Preserve existing rejections (lyric lines with punctuation like `G, D, Em, C.` stay rejected).
- Render instrumental rows in the editor with no lyric input beside them.
- Preserve instrumental spacing in both OnSong export formats.
- No behavioural regressions for chords-over-lyrics or bracketed output on non-instrumental rows.

**Non-Goals:**
- Section headers (`[Intro]`, `[Chorus]`) — out of scope; still classified as lyric lines.
- Backslash `\` — dropped from the allowed alphabet (no standard notation uses it).
- Parsing-back / editing instrumental bar structure as first-class data. Bars are preserved as strings, not structured.
- Persisting an explicit "instrumental" flag in Redux state — detection is derived from row content.

## Decisions

### 1. Classifier rule: character whitelist + every-word-is-a-chord

A line is a chord line iff BOTH hold:

1. Every character belongs to the set: word chars (`A-Za-z0-9#♭♯`), whitespace, instrumental punctuation (`|`, `[`, `]`, `:`, `/`, `(`, `)`), or common trailing punctuation (`,`, `.`).
2. Every maximal alphabetic run (word) in the line matches `chordRegex`.

Consequences (cross-checked with examples from explore):

| Input | Classification |
|---|---|
| `\| G \| D \| Em \| C \|` | chord ✓ |
| `\|: G D Em C :\|` | chord ✓ |
| `[G] [D] [Em] [C]` | chord ✓ |
| `\| G / / / \| D / / / \|` | chord ✓ |
| `Verse 1: G D Em C` | lyric ✓ (`Verse` breaks rule 2) |
| `[Intro]` | lyric ✓ (`Intro` breaks rule 2) |
| `[Chorus] G D` | lyric ✓ (`Chorus` breaks rule 2) |
| `G, D, Em, C.` | chord ✓ (words `G`, `D`, `Em`, `C` all valid; `,` and `.` allowed) |
| `Hello, world.` | lyric ✓ (`Hello` and `world` are not chords) |
| `G D Em C` | chord ✓ (existing behaviour) |

_Alternative: single regex._ Rejected — the "every word must be a chord" requirement crosses token boundaries and needs a two-pass scan: cheap to write, and far more legible than a mega-regex.

### 2. Token extraction algorithm

```ts
function isChordsOnly(line: string): boolean {
    const allowedNonWord = /[\s|\[\]:/(),.]/;
    for (const ch of line) {
        if (!/[A-Za-z0-9#♭♯]/.test(ch) && !allowedNonWord.test(ch)) return false;
    }
    const words = line.match(/[A-Za-z0-9#♭♯]+/g) ?? [];
    if (words.length === 0) return false;
    return words.every(w => new RegExp(`^${chordRegex}$`).test(w));
}
```

Whitespace-only lines return `false` (unchanged from today). A line containing *only* punctuation (e.g. `| | |`) also returns `false` — there's no chord content to transpose.

### 3. Instrumental-row detection is derived (UI only)

A row is treated as instrumental when rendering iff:
- The chord row content matches `/[|\[\]:()]/` OR contains a standalone `/` token (between whitespace), AND
- The paired lyric line at the same index is empty/whitespace-only.

This is pure derivation from existing state — no schema change, no new Redux action. The `ChordSheetRow` component receives the chord string + lyric and hides its lyric input when the predicate fires.

_Trade-off:_ if a user manually types lyrics under an instrumental-shaped row, the row reverts to a normal chord row (lyric input reappears). This is acceptable — it's the least-surprising behaviour.

_Alternative: explicit `instrumental: boolean[]` in state._ Rejected as premature — adds state to solve a rendering concern that derivation solves for free. Can be added later if derivation proves insufficient.

### 4. Separator: remove auto-blank between adjacent chord rows

Today `parseChordsAndSongText` inserts a blank lyric line between two consecutive `isChordsOnly` lines (line 14 of `src/lib/songTextChordsSeparator/index.ts`):

```ts
if (isChordsOnly(curr)) {
    return isChordsOnly(previousLine ?? '') ? [...acc, ''] : acc;
}
```

New behaviour: respect the user's input. Preserve a blank line only if the source had one. Concretely: delete the auto-insertion branch entirely, and adjust the symmetric chord-extraction reducer the same way.

### 5. Bracketed formatter: preserve instrumental spacing

`formatBracketed` currently emits instrumental rows via `tokens.map(t => t.formatted).join('')` (line 77), producing `|[G]|[D]|[Em]|[C]|`. Change this branch to walk the original chord line, inserting each token's `formatted` string at its offset and copying whitespace between offsets verbatim. Output becomes `| [G] | [D] | [Em] | [C] |`.

The non-instrumental branch is unchanged.

### 6. Allowed-punctuation alphabet: final list

`| [ ] : / ( ) , .` plus the existing `/` inside chord regex for slash-bass. `\` is dropped.

The `,` and `.` additions cover chord lines pasted with list-style punctuation (`G, D, Em, C.`). The every-word-is-a-chord invariant keeps lyric lines like `Hello, world.` safely rejected — their words (`Hello`, `world`) aren't chords.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| New classifier might accept something it shouldn't | Unit tests enumerate both sides; `Verse 1:` and `[Intro]` are explicit rejection tests |
| Removing auto-blank could regress existing pastes | Add a focused unit test for `parseChordsAndSongText` with back-to-back chord rows + separate test with a user-supplied blank line between them |
| Derived instrumental detection misfires on existing data | The heuristic checks both instrumental punctuation AND empty lyric — collision with normal rows requires deliberate construction |
| OnSong bracketed formatter breaks existing scenarios | All existing bracketed-formatter scenarios have non-empty lyrics and won't hit the instrumental branch |
| Editor row rendering breaks transpose/undo/paste flows | Row-selection and paste indices are unchanged (still `chordSheet.value[i]` paired with `songText[i]`); only the DOM output differs |

## Open Questions

None at this stage. If the derived instrumental detection proves fragile in use, the fallback is an explicit flag in state (Decision 3 alternative) — deferrable.
