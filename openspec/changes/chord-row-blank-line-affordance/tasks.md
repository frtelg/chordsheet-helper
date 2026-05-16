## 1. CSS — blank-line separator

- [x] 1.1 Add `.SongTextRowContainer--preceded-by-blank` rule to `src/app/globals.css`:
  `margin-top: var(--space-4); border-top: 1px dashed var(--color-border-muted); padding-top: var(--space-2);`

## 2. ChordSheetRow — apply modifier class

- [x] 2.1 In the new-UX branch of `src/container/ChordSheetEditor/ChordSheetRow/index.tsx`,
  add `row.precededByBlank && rowIndex > 0 ? 'SongTextRowContainer--preceded-by-blank' : ''`
  to the `containerClasses` array
- [x] 2.2 Apply the same modifier class in the legacy UX branch (`className` string on the
  root `div`)

## 3. SelectionActionBar — tooltip copy

- [x] 3.1 In `src/container/ChordSheetEditor/SelectionActionBar/index.tsx`, derive
  `spansBoundary: boolean` — true when `!isContiguous && maxIdx - minIdx > indexes.length - 1`
- [x] 3.2 Set `title` on `Move ↑` button:
  - disabled + `minIdx === 0`: `"Already at the top"`
  - disabled + `spansBoundary`: `"Selection crosses a blank-line boundary"`
  - disabled + non-contiguous (other): `"Selection is not contiguous"`
  - enabled: `"Move selection up"`
- [x] 3.3 Mirror same logic for `Move ↓` button (`maxIdx === rows.length - 1` → `"Already at the bottom"`)

## 4. Unit tests

- [x] 4.1 Add test to `src/container/ChordSheetEditor/ChordSheetRow/ChordSheetRow.spec.tsx`:
  render with `precededByBlank=true, rowIndex=1` → assert container has class
  `SongTextRowContainer--preceded-by-blank`
- [x] 4.2 Add test: `precededByBlank=true, rowIndex=0` → class NOT present
- [x] 4.3 Add test: `precededByBlank=false, rowIndex=1` → class NOT present

## 5. E2E tests

- [x] 5.1 Add test to `e2e/tests/blank-line-separator.spec.ts`:
  paste canonical with one blank line between two chord+lyric rows, assert the second row's
  bounding rect top is at least `space-4` (16px) greater than the first row's bottom
- [x] 5.2 Add test: select both rows across the blank-line gap, assert `Move ↑` is disabled and
  its `title` attribute equals `"Selection crosses a blank-line boundary"`

## 6. Quality gate

- [x] 6.1 `yarn test --watchAll=false` — all suites pass
- [x] 6.2 `yarn build` — no errors
- [x] 6.3 `yarn playwright test` — all tests pass
