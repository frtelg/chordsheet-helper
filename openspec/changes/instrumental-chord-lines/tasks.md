## 1. Classifier

- [x] 1.1 Rewrite `src/lib/chord/isChordsOnly.ts` with the two-pass algorithm (character whitelist + every-word-is-a-chord)
- [x] 1.2 Extend `src/lib/chord/isChordsOnly.spec.ts` with a unit test for EVERY scenario in `specs/chord-classifier/spec.md` — instrumental accepts, lyric rejects, comma/period chord lines accept, comma/period lyric lines reject
- [x] 1.3 Flip the existing failing-case test for `"G, D, Em, C."` to assert true (previously asserted false)
- [x] 1.4 Add boundary tests: empty string, whitespace-only, punctuation-only (`| | |`), single chord (`G`), single instrumental token (`|:`)

## 2. Song-Text Separator

- [x] 2.1 Remove the auto-blank-between-adjacent-chord-rows branches in `src/lib/songTextChordsSeparator/index.ts` (both the song-text reducer and the chords reducer)
- [x] 2.2 Add unit tests for `parseChordsAndSongText`:
    - Adjacent chord rows → no synthetic blank between them
    - Chord row + blank line + chord row → blank preserved
    - Interleaved chord / lyric / chord → correct pairing

## 3. Editor Instrumental Rendering

- [x] 3.1 In `src/container/ChordSheetEditor/ChordSheetRow/index.tsx`, compute `isInstrumental` from chord content + paired lyric emptiness; hide the lyric input when true
- [x] 3.2 Verify row-select, copy, paste, move-up, move-down, undo still index-align correctly with instrumental rows mixed in

## 4. Bracketed Formatter — Instrumental Spacing

- [x] 4.1 Rewrite the `lyricLine.trim() === ''` branch in `src/lib/onsong/bracketedFormatter.ts` to walk the original chord line, inserting each token's formatted string at its offset and copying interstitial whitespace verbatim
- [x] 4.2 Add scenarios to `src/lib/onsong/bracketedFormatter.spec.ts`:
    - `| G | D | Em | C |` → `| [G] | [D] | [Em] | [C] |`
    - `|: G D :|` → `|: [G] [D] :|`
    - `| G / / / | D / / / |` → `| [G] / / / | [D] / / / |`
    - Existing instrumental scenarios (`G   D` → `[G]   [D]`) still pass

## 5. End-to-End (at least one required)

- [x] 5.1 Add an E2E test in `e2e/tests/` that pastes a chart containing mixed instrumental and lyric sections; assert chord rows are populated with bar notation (`| G | D | Em | C |`); assert lyric inputs are hidden on instrumental rows; assert the download contains `| [G] | [D] |` in bracketed mode and `| G | D |` in chords-over-lyrics mode
- [x] 5.2 Extend `e2e/test-data/songs.ts` with an instrumental-section fixture

## 6. Quality Gate

- [x] 6.1 `yarn test --watchAll=false` — all suites pass
- [x] 6.2 `yarn build` — no errors
- [x] 6.3 `yarn playwright test` — all existing tests + new E2E pass
