## 1. Canonical State Slice

- [x] 1.1 Create `src/redux/reducer/CanonicalReducer.ts` with state `{ value: string; history: string[] }` and actions `setCanonical`, `replaceLine`, `transposeAll`, `moveUp`, `moveDown`, `pasteSelected`, `resetCanonical`, `undo`
- [x] 1.2 Wire the slice into `src/redux/store/index.ts`
- [x] 1.3 Remove `chordSheet.value` and `songText.value` from their respective slices, or merge both slices into the canonical slice (pick one in implementation)
- [x] 1.4 Unit tests for every action: empty start, single-line edit, multi-line edit, replaceLine at boundary indices, transposeAll round-trip, undo through every mutating action, paste at index 0 / middle / end

## 2. Parser and Selectors

- [x] 2.1 Create `src/lib/onsong/bracketedParser.ts` exporting `parseCanonical(value: string) => Row[]` where `Row = { chord: string; lyric: string; isInstrumental: boolean; sourceLineIndex: number }`
- [x] 2.2 Reuse `isChordsOnly` for line classification; treat any line containing `[chord]` segments as a paired chord+lyric line; implement Rule A (chord-only line → paired row with empty lyric, `isInstrumental: true`) and Rule B (run of N empty lines → `max(0, N − 2)` silent-rest rows; start/end of sheet acts as a separator) per spec
- [x] 2.3 Add `extractChords(line: string) => string[]` that returns the chord tokens from `[chord]` segments
- [x] 2.4 Create `src/redux/selectors/canonicalRows.ts` with `selectRows`, `selectChordTokens`, `selectKey` using `createSelector` from `reselect`
- [x] 2.5 Unit tests: parser handles every shape from the spec (pure lyric, pure chord, instrumental, mixed bracketed, adjacent chord rows); cover every empty-line scenario from `Instrumental row classification` (1, 2, 3, 4 empties between lyrics; chord-only with and without separators; chord-only followed by silent rest; start-of-sheet and end-of-sheet boundary cases); selectors memoise (identity test on repeated calls with same input)

## 3. Bracketed Line Writer

- [x] 3.1 Add `formatBracketedLine(chord: string, lyric: string) => string` to `src/lib/onsong/bracketedFormatter.ts` that emits a single canonical line from a row
- [x] 3.2 Add `chordsOverLyricsToBracketed(input: string) => string` that converts pasted chords-over-lyrics text to a single bracketed canonical string (replaces the two-array output of `parseChordsAndSongText`)
- [x] 3.3 Unit tests: every bracketed-line shape round-trips through `parseCanonical → formatBracketedLine`; `chordsOverLyricsToBracketed` handles instrumental rows, adjacent chord rows, blank separators

## 4. Left Textarea — Live Edit and Format Toggle

- [x] 4.1 In `src/container/SongTextInput/index.tsx`, switch the textarea `value` to come from the canonical slice, dispatch `setCanonical` on every `onChange`
- [x] 4.2 Add a format-toggle React `useState` (`'bracketed' | 'over-lyrics'`); add a segmented-control toolbar above the textarea
- [x] 4.3 In `'over-lyrics'` mode, render via the chords-over-lyrics formatter applied to `selectRows()`; on `onChange`, parse via `chordsOverLyricsToBracketed` before dispatching
- [x] 4.4 Reject edits that introduce a literal `[` outside a valid `[chord]` token; surface a small inline warning
- [x] 4.5 Implement cursor preservation: `useRef` for last cursor position, `useRef` for focus origin, `useLayoutEffect` restore when origin is `'right'`
- [x] 4.6 Unit tests for the component: typing dispatches; toggle re-renders correctly; rejected `[` edit reverts; cursor preservation hook behaves on origin change

## 5. Right-Side Editor — Read From Selector, Dispatch replaceLine

- [x] 5.1 In `src/container/ChordSheetEditor/index.tsx`, replace `useSelector(chords)` and `songTextArray` derivation with `useSelector(selectRows)`
- [x] 5.2 Update `ChordSheetRow` to receive a `Row` and dispatch `replaceLine({ index: row.sourceLineIndex, chord, lyric })` on chord input blur and lyric input blur
- [x] 5.3 Set `focusOrigin.current = 'right'` (via shared context or a callback prop wired through to the SongTextInput) before each right-side dispatch
- [x] 5.4 Update `Transposer`, `HelpersBar`, and the row-selection actions to operate on the canonical slice via `sourceLineIndex`
- [x] 5.5 Unit tests: row dispatch emits the correct line index; transpose mutates only bracketed segments; row select / move / paste preserve other lines

## 6. Paste Flow

- [x] 6.1 Update `ProcessChordLinesModal` handler in `src/container/SongTextInput/index.tsx` to call `chordsOverLyricsToBracketed` and dispatch a single `setCanonical`
- [x] 6.2 Remove the now-unused `dispatchChords` parameter from `parseChordsAndSongText` (or replace the function with the new converter)
- [x] 6.3 Unit tests: legacy chords-over-lyrics paste produces the expected bracketed canonical string; instrumental rows preserved

## 7. End-to-End

- [x] 7.1 Add `e2e/tests/bidirectional-sync.spec.ts` covering the happy path: type lyrics on the left, add a chord on the right, observe the bracketed canonical text appear in the left textarea
- [x] 7.2 In the same test, toggle the format selector and observe the rendered switch (bracketed → chords-over-lyrics → bracketed) without losing data
- [x] 7.3 Transpose, observe both views update consistently
- [x] 7.4 Type a literal `[` in a lyric line, observe the edit is rejected and the warning appears
- [x] 7.5 Update `e2e/fixtures/chord-sheet-app.ts` with helpers for the format toggle and the canonical textarea

## 8. Cleanup

- [x] 8.1 Delete dead code paths: old `chordSheet.value` references, old `parseChordsAndSongText` two-array output if fully replaced, anything orphaned by the slice merge
- [x] 8.2 Update `src/redux/store/index.ts` types (`RootState`, `ReduxState`)
- [x] 8.3 Update `.wolf/anatomy.md` and `.wolf/cerebrum.md` per OpenWolf protocol

## 9. Quality Gate

- [x] 9.1 `yarn test --watchAll=false` — all suites pass
- [x] 9.2 `yarn build` — no errors
- [x] 9.3 `yarn playwright test` — all existing 27+ tests plus new bidirectional-sync test pass
- [ ] 9.4 Manual smoke: paste a real song, edit on both sides, toggle format, transpose, undo
