## Why

When the canonical string contains a blank line between two non-blank rows, `parseCanonical`
consumes the blank as a separator and sets `precededByBlank: true` on the next row. The chord
editor does not render any visual gap for this flag — all rows stack identically regardless of
blank-line boundaries in the source. The separator information exists in the model but is lost
in the view.

This causes two problems:

1. **Invisible structure.** The user cannot see where verse/section boundaries fall in the editor.
   A line like `Onfeilbaar eerlijk,` looks adjacent to `Die nooit veranderen zal.` even though a
   blank line separates them in the canonical string.

2. **Surprising disabled state.** Selecting rows that cross a blank-line boundary produces a
   non-contiguous `sourceLineIndex` set (e.g. `[7, 9]`). The `SelectionActionBar` correctly
   disables Move ↑/↓ for non-contiguous selections, but with no visible gap the user has no idea
   why — the rows look contiguous. The spec left "contiguous" undefined with respect to blank-line
   gaps, and provided no tooltip or explanatory affordance.

## What Changes

- The editor renders a visible vertical separator (larger top margin + subtle top rule) above every
  row whose `precededByBlank === true`.
- The disabled Move ↑/↓ buttons gain a tooltip clarifying when the reason is a blank-line gap.
- The chord-row-interactions spec is updated to define "contiguous" explicitly and to add a
  blank-line-gap scenario.
- A new `blank-line-affordance` spec is added covering editor visual rendering of
  `precededByBlank` rows.

## Capabilities

### Modified Capabilities

- `chord-row-interactions` (light touch): tighten the definition of "contiguous selection" in the
  Move ↑/↓ disabled scenario; add blank-line-gap scenario.

### New Capabilities

- `blank-line-affordance`: Contract for how the editor visually represents blank source lines that
  are consumed as separators by `parseCanonical`.

## Impact

- `src/container/ChordSheetEditor/ChordSheetRow/index.tsx` — add
  `SongTextRowContainer--preceded-by-blank` modifier class when `row.precededByBlank && rowIndex > 0`.
- `src/app/globals.css` — style for `--preceded-by-blank`: larger top margin + dashed top border.
- `src/container/ChordSheetEditor/SelectionActionBar/index.tsx` — tooltip on disabled Move buttons
  distinguishing boundary vs. non-contiguous reason.
- Unit test: render `ChordSheetRow` with `precededByBlank=true`, assert modifier class.
- E2E test: paste song with blank-line section break, assert visible gap and disabled Move across it.
