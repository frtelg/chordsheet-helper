## Why

The app currently exports chord sheets in only one format — chords on a line above lyrics (the "chords-over-lyrics" style). OnSong supports two formats: chords-over-lyrics and bracketed inline chords (`[G]Amazing [D]grace`). Users who target OnSong or prefer inline notation have no way to get a bracketed export.

## What Changes

- Add a new Redux state field (`onsongFormat`) in `AppReducer` to track the selected export format (`chords-over-lyrics` | `bracketed`).
- Add a format-selector toggle switch in `ChordSheetResult` UI (visible alongside the Edit/Download buttons).
- Add a `src/lib/onsong/` module with two formatters: one for each format. The bracketed formatter aligns each chord to its horizontal position over the lyric text to determine insertion index.
- Update `ChordSheetResult` to render the preview using the selected format and pass the correctly-formatted string to `DownloadTextAsFileLink`.

## Capabilities

### New Capabilities

- `onsong-format-selector`: UI switch and Redux state for selecting between `chords-over-lyrics` and `bracketed` OnSong export format; applies to both the result preview and the downloaded `.txt` file.
- `onsong-bracketed-formatter`: Pure function that converts a (chords-line, lyrics-line) pair into a single bracketed line using chord positions derived from character offsets.

### Modified Capabilities

## Impact

- `src/redux/reducer/AppReducer.ts` — new `onsongFormat` state field and `setOnsongFormat` action.
- `src/container/ChordSheetResult/index.tsx` — reads `onsongFormat`, renders toggle switch, reformats output.
- New `src/lib/onsong/` directory — `formatChordSheet.ts` (entry point) + `bracketedFormatter.ts`.
- No changes to the editor, transposer, or chord-parsing layers.
