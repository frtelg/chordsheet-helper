## Context

`parseCanonical` (src/lib/onsong/bracketedParser.ts) consumes blank lines between rows as
separators. When exactly one blank line separates two content rows, the second row gets
`precededByBlank: true`. The flag is currently only used by `renderOverLyrics` in the textarea
mirror (SongTextInput). The chord editor (`ChordSheetEditor` + `ChordSheetRow`) ignores it.

The `SelectionActionBar` disables Move ↑/↓ when the selection is non-contiguous, where
contiguous is defined as: the sorted `sourceLineIndex` values form a consecutive integer
sequence. A blank source line between two rendered rows creates a gap in `sourceLineIndex`
(e.g. rows at source indexes 7 and 9, with blank at 8), making those rows non-contiguous.
This is the correct behaviour — rotating across a blank line would silently move a chord over
the silent-rest line. But the user sees no visual signal explaining the disabled state.

## Goals / Non-Goals

**Goals**
- Visual separator in the editor for every `precededByBlank` row (verse/section boundary visible).
- Tooltip on disabled Move buttons when reason is a blank-line gap.
- Spec precision: define "contiguous" explicitly.

**Non-Goals**
- Changing move semantics to allow rotation across blank lines.
- Rendering multi-blank separators differently from single-blank (Rule B produces them as
  `isInstrumental` rows already; this change only concerns the `precededByBlank` flag).
- Changing the canonical string structure or parseCanonical logic.

## Decisions

### Decision: CSS modifier class on the row container

**What:** When `row.precededByBlank === true && rowIndex > 0`, the `SongTextRowContainer` gets
class `SongTextRowContainer--preceded-by-blank`. The class adds:

```css
.SongTextRowContainer--preceded-by-blank {
  margin-top: var(--space-4);
  border-top: 1px dashed var(--color-border-muted);
  padding-top: var(--space-2);
}
```

The dashed rule reads as "there was a blank line here in the source" without mimicking a heading
or section title, keeping the editor feeling like an editing surface rather than a document.

**Why:** Purely presentational. The flag is already in the model — no state changes. The class
guard `rowIndex > 0` prevents a phantom separator above the first row (which can't logically be
preceded by blank given parseCanonical semantics, but defensive).

**Alternatives considered:**
- *Emit a dedicated `<hr>` element between rows:* Adds a DOM node outside the listbox
  `role="option"` items, breaking ARIA listbox semantics. Rejected.
- *Larger margin only, no border:* Less discoverable — looks like inconsistent spacing.
  Rejected.

### Decision: Tooltip on disabled Move buttons

**What:** `SelectionActionBar` already tracks `isContiguous`. Add a derived
`nonContiguousSpansBoundary` boolean: true when selection is non-contiguous AND
`maxSourceIdx - minSourceIdx > indexes.length - 1` (gap larger than expected for the count).
Pass as `title` attribute to the Move buttons when disabled:

- Boundary gap: `"Selection crosses a blank-line boundary"`
- Other non-contiguous (cmd+click toggle): `"Selection is not contiguous"`
- Boundary/top: `"Already at the top"` / `"Already at the bottom"`

**Why:** Minimal change. Tooltip is accessible (screen reader announces on focus) and visible on
hover without adding permanent UI chrome.

**Alternatives considered:**
- *Inline explanatory text in the action bar:* Clutters the bar. Rejected.
- *No tooltip, just accept the user confusion:* The separator addresses the root confusion; the
  tooltip is a belt-and-suspenders fallback for discoverability.

## Data flow

```
parseCanonical → Row.precededByBlank
    → ChordSheetRow prop → CSS modifier class → visual gap
    → SelectionActionBar sourceIndex gap check → tooltip copy
```

No new state. No new selectors. No reducer changes.
