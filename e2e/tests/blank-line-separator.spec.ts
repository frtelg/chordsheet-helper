import { test, expect } from '../fixtures/chord-sheet-app';

// Canonical layout (sourceLineIndex → content):
//   0 → "intro"          (row 0 — no blank before)
//   1 → "[Am]verse one"  (row 1)
//   2 → ""               (blank — consumed as separator, not rendered)
//   3 → "[G]verse two"   (row 2, precededByBlank=true)
//   4 → "[C]outro"       (row 3)
//   5 → "fin"            (row 4 — ensures row 2 is not at the bottom)
//
// Row positions 1 and 2 (sLI=1 and sLI=3) span the blank at sLI=2.
const WITH_BLANK = 'intro\n[Am]verse one\n\n[G]verse two\n[C]outro\nfin';

test.describe('Blank-line separator affordance', () => {
    test.beforeEach(async ({ app }) => {
        await app.pasteLyricsViaButton(WITH_BLANK);
        await app.rowAt(0).waitFor({ state: 'visible' });
    });

    test('row preceded by blank has CSS separator class', async ({ app }) => {
        // Row 2 (sLI=3) is preceded by blank at sLI=2
        await expect(app.rowAt(2)).toHaveClass(/SongTextRowContainer--preceded-by-blank/);
    });

    test('row NOT preceded by blank has no separator class', async ({ app }) => {
        await expect(app.rowAt(0)).not.toHaveClass(/SongTextRowContainer--preceded-by-blank/);
        await expect(app.rowAt(1)).not.toHaveClass(/SongTextRowContainer--preceded-by-blank/);
        await expect(app.rowAt(3)).not.toHaveClass(/SongTextRowContainer--preceded-by-blank/);
    });

    test('separator row is visually offset from previous row', async ({ app }) => {
        // Compare gap between rows 1→2 (spans blank) vs rows 2→3 (no blank)
        const row1 = app.rowAt(1);
        const row2 = app.rowAt(2);
        const row3 = app.rowAt(3);

        const box1 = await row1.boundingBox();
        const box2 = await row2.boundingBox();
        const box3 = await row3.boundingBox();

        expect(box1).not.toBeNull();
        expect(box2).not.toBeNull();
        expect(box3).not.toBeNull();

        // Gap from row1 bottom to row2 top (has blank) > gap from row2 bottom to row3 top (no blank)
        const gapWithBlank = box2!.y - (box1!.y + box1!.height);
        const gapNoBlank = box3!.y - (box2!.y + box2!.height);
        expect(gapWithBlank).toBeGreaterThan(gapNoBlank);
    });

    test('Move ↑/↓ disabled with boundary tooltip when selection spans blank line', async ({
        app,
    }) => {
        // Toggle-select sLI=1 (row1) then sLI=3 (row2) — gap at sLI=2 is blank (not rendered).
        // Both rows are not at top/bottom, so boundary title fires for both buttons.
        await app.selectRow(1);    // sourceLineIndex 1 → [Am]verse one
        await app.cmdSelectRow(3); // sourceLineIndex 3 → [G]verse two — indexes=[1,3], gap→spansBoundary

        await expect(app.selectionActionBar).toBeVisible();

        const boundaryButtons = app.page.locator(
            '.SelectionBarButton[title="Selection crosses a blank-line boundary"]',
        );
        await expect(boundaryButtons).toHaveCount(2);
        await expect(boundaryButtons.first()).toBeDisabled();
        await expect(boundaryButtons.last()).toBeDisabled();
    });
});
