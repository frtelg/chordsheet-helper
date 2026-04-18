## 1. Redux State

- [x] 1.1 Add `onsongFormat: 'chords-over-lyrics' | 'bracketed'` field and `setOnsongFormat` action to `AppReducer`
- [x] 1.2 Add unit tests for `AppReducer` — initial state defaults to `'chords-over-lyrics'`; `setOnsongFormat` updates the value

## 2. Bracketed Formatter

- [x] 2.1 Create `src/lib/onsong/bracketedFormatter.ts` — implement `formatBracketed(chordLine, lyricLine): string` using the position-scan algorithm from design; classify tokens as chord, optional chord `(…)`, or bar separator (`|`, `||`, `||:`, `:||`)
- [x] 2.2 Write unit tests for `formatBracketed` covering all scenarios in `onsong-bracketed-formatter/spec.md` (including optional chords and bar separators)

## 3. Chord Sheet Formatter Entry Point

- [x] 3.1 Create `src/lib/onsong/formatChordSheet.ts` — implement `formatChordSheet(format, chords, songLines): string`; suppress blank lines between consecutive instrumental rows in both formats
- [x] 3.2 Write unit tests for `formatChordSheet` covering: chords-over-lyrics, bracketed, rows without chords, consecutive instrumental rows (no blank line between them)

## 4. Result View Integration

- [x] 4.1 Update `ChordSheetResult` to read `onsongFormat` from Redux and use `formatChordSheet` for the preview render (replacing inline `chordSheetList` assembly)
- [x] 4.2 Update `ChordSheetResult` to pass the formatted string (respecting `onsongFormat`) to `DownloadTextAsFileLink`
- [x] 4.3 Add a toggle switch (`<input type="checkbox">`) labelled "Bracketed chords" that dispatches `setOnsongFormat` on change

## 5. Quality Gate

- [x] 5.1 Run `yarn test --watchAll=false` — all suites pass
- [x] 5.2 Run `yarn build` — no errors
- [x] 5.3 Run `yarn playwright test` — all 33 tests pass (27 original + 6 new chord-format E2E)
