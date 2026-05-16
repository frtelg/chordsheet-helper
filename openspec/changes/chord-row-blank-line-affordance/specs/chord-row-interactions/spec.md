## MODIFIED Requirements

### Requirement: Contextual selection action bar

_Modifies the same-named requirement in `chord-row-ux-overhaul`._

When `indexes.length > 0`, a sticky action bar SHALL appear at the bottom of the editor pane.
The bar SHALL contain: row-count pill, `Move ↑`, `Move ↓`, `Copy`, `Cut`, `Paste after target`,
`Delete`, `Clear`. The bar SHALL be hidden when the selection is empty.

**Definition of contiguous:** A selection is contiguous if and only if the sorted
`sourceLineIndex` values of every selected row form a consecutive integer sequence — that is,
`maxSourceIdx - minSourceIdx === indexes.length - 1`. A blank source line between two rendered
rows creates a gap in `sourceLineIndex`; a selection spanning that gap is non-contiguous.

#### Scenario: Move up/down disabled at boundaries
- **GIVEN** the selection contains the topmost row
- **THEN** `Move ↑` is disabled with tooltip `"Already at the top"`
- **AND GIVEN** the selection contains the bottommost row
- **THEN** `Move ↓` is disabled with tooltip `"Already at the bottom"`

#### Scenario: Move up/down disabled for non-contiguous selection
- **GIVEN** the selection is non-contiguous (e.g. indexes `[1, 4]` via cmd+click)
- **THEN** both `Move ↑` and `Move ↓` are disabled with tooltip `"Selection is not contiguous"`

#### Scenario: Move up/down disabled when selection spans a blank source line
- **GIVEN** the canonical contains a blank line between two non-blank rows at source indexes N
  and N+2
- **AND** the user selects both rendered rows (sourceLineIndex `N` and `N+2`)
- **THEN** `Move ↑` and `Move ↓` are disabled
- **AND** their tooltip reads `"Selection crosses a blank-line boundary"`

#### Scenario: Move enabled for contiguous selection not at a boundary
- **GIVEN** rows at source indexes 3, 4, 5 are selected (consecutive, no blank gaps)
- **AND** row 2 and row 6 exist
- **THEN** `Move ↑` and `Move ↓` are both enabled
