## ADDED Requirements

### Requirement: Editor renders visible separator for blank source lines

The chord editor SHALL render a visible vertical separator above any rendered row whose
`precededByBlank === true`. The separator SHALL be visible without hover, in both legacy and
new-UX modes.

The separator SHALL be implemented as an increased top margin combined with a subtle top border on
the row container. It SHALL NOT be a standalone DOM element between `role="option"` items, to
preserve ARIA listbox semantics.

The separator SHALL NOT appear above the first rendered row regardless of `precededByBlank` state.

#### Scenario: Row preceded by blank shows separator

- **GIVEN** the canonical is `"[Am]love\n\n[G]me"` (one blank line between two rows)
- **WHEN** the rows are rendered in the chord editor
- **THEN** the row for `"[G]me"` has `precededByBlank === true`
- **AND** its container has class `SongTextRowContainer--preceded-by-blank`
- **AND** a visible top rule and larger top margin are rendered above it

#### Scenario: Row not preceded by blank has no separator

- **GIVEN** the canonical is `"[Am]love\n[G]me"` (no blank line)
- **WHEN** the rows are rendered
- **THEN** neither row container has class `SongTextRowContainer--preceded-by-blank`
- **AND** no extra top margin or border appears between them

#### Scenario: Separator does not appear above the first row

- **GIVEN** the first parsed row has `precededByBlank === true` (edge case)
- **WHEN** rendered with `rowIndex === 0`
- **THEN** the modifier class is NOT applied

#### Scenario: Multiple blank lines between rows still shows single separator

- **GIVEN** the canonical has two consecutive blank lines between content rows (Rule B: both
  consumed as separators, `rests = 0`, `precededByBlank = true` on next row)
- **WHEN** rendered
- **THEN** exactly one separator gap is visible (the CSS class is binary; no stacking)
