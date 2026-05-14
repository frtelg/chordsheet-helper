import { test, expect } from '../fixtures/chord-sheet-app';

// Four rows with distinct chords and lyrics
const FOUR_ROWS = '[Am]verse one\n[G]verse two\n[C]chorus\n[F]bridge';

test.describe('Row clipboard — chord-only copy/paste/cut', () => {
    test.beforeEach(async ({ app }) => {
        await app.pasteLyricsViaButton(FOUR_ROWS);
        await app.rowAt(0).waitFor({ state: 'visible' });
    });

    test('copy + paste overwrites chord values downward; lyrics stay', async ({ app }) => {
        // Select rows 0 and 1 (chords: Am, G) and copy
        await app.selectRow(0);
        await app.shiftSelectRow(1);
        await app.clickActionBarButton('Copy chord values');

        // Clear selection, select row 2 as paste target
        await app.clearSelection();
        await app.selectRow(2);

        // Paste at row 2 via action bar (row 2 is focused/hovered target)
        // Use keyboard shortcut Cmd+V with focus on the listbox
        await app.chordEditor.click();
        const mod = process.platform === 'darwin' ? 'Meta' : 'Control';
        await app.page.keyboard.press(`${mod}+v`);

        // Row 2 should now have Am chord, row 3 should have G chord
        await expect(app.chordInputAt(2)).toHaveValue('Am');
        await expect(app.chordInputAt(3)).toHaveValue('G');

        // Line count unchanged (no lines inserted)
        const rows = await app.page.locator('[role="option"]').count();
        expect(rows).toBe(4);

        // Original rows 0 and 1 are unchanged
        await expect(app.chordInputAt(0)).toHaveValue('Am');
        await expect(app.chordInputAt(1)).toHaveValue('G');
    });

    test('cut clears chord values from source rows; lyrics stay; no lines deleted', async ({ app }) => {
        // Select rows 0 and 1 and cut
        await app.selectRow(0);
        await app.shiftSelectRow(1);
        await app.clickActionBarButton('Cut chord values');

        // Source rows should now have empty chords
        await expect(app.chordInputAt(0)).toHaveValue('');
        await expect(app.chordInputAt(1)).toHaveValue('');

        // Rows 2 and 3 are unchanged
        await expect(app.chordInputAt(2)).toHaveValue('C');
        await expect(app.chordInputAt(3)).toHaveValue('F');

        // Line count unchanged (no lines deleted)
        const rows = await app.page.locator('[role="option"]').count();
        expect(rows).toBe(4);
    });

    test('clear chords removes chord values; lyrics stay', async ({ app }) => {
        await app.selectRow(1);
        await app.shiftSelectRow(2);
        await app.clickActionBarButton('Clear chord values');

        await expect(app.chordInputAt(1)).toHaveValue('');
        await expect(app.chordInputAt(2)).toHaveValue('');
        // Surrounding rows unchanged
        await expect(app.chordInputAt(0)).toHaveValue('Am');
        await expect(app.chordInputAt(3)).toHaveValue('F');

        const rows = await app.page.locator('[role="option"]').count();
        expect(rows).toBe(4);
    });

    test('snackbar appears after cut with Undo button', async ({ app }) => {
        await app.selectRow(0);
        await app.clickActionBarButton('Cut chord values');
        await expect(app.snackbar).toBeVisible();
        await expect(app.page.getByRole('button', { name: 'Undo' })).toBeVisible();
    });

    test('undo via snackbar restores chord values after cut', async ({ app }) => {
        await app.selectRow(0);
        await app.clickActionBarButton('Cut chord values');
        // Verify chord was cleared
        await expect(app.chordInputAt(0)).toHaveValue('');
        // Click Undo in snackbar
        await app.page.getByRole('button', { name: 'Undo' }).click();
        // Chord should be restored
        await expect(app.chordInputAt(0)).toHaveValue('Am');
    });
});

test.describe('Row clipboard — paste anchors at clicked row (real clicks)', () => {
    // Five rows so we can reproduce the original bug: shift-click 1..3, cut,
    // click row 0, paste — paste must anchor at row 0, not at a stale focus
    // from the prior shift-click on row 3.
    const FIVE_ROWS = '[Am]verse one\n[G]verse two\n[C]chorus\n[F]bridge\n[Em]outro';

    test.beforeEach(async ({ app }) => {
        await app.pasteLyricsViaButton(FIVE_ROWS);
        await app.rowAt(0).waitFor({ state: 'visible' });
    });

    test('cut then click destination row then Cmd+V anchors paste at clicked row', async ({
        app,
    }) => {
        const mod = process.platform === 'darwin' ? 'Meta' : 'Control';

        // Real click to select row 1, then real shift-click row 3 to extend range.
        // Click the row container (not an inner input) — use position to land
        // on row chrome rather than the chord/lyric input.
        await app.rowAt(1).click({ position: { x: 5, y: 5 } });
        await app.rowAt(3).click({ position: { x: 5, y: 5 }, modifiers: ['Shift'] });

        // Move keyboard focus onto the listbox container so the listbox-level
        // shortcuts fire (they early-return when focus is in an input).
        await app.page.locator('[role="listbox"]').focus();

        // Cut via keyboard.
        await app.page.keyboard.press(`${mod}+x`);

        // Verify cut emptied rows 1..3.
        await expect(app.chordInputAt(1)).toHaveValue('');
        await expect(app.chordInputAt(2)).toHaveValue('');
        await expect(app.chordInputAt(3)).toHaveValue('');

        // Real click on row 0 to make it the paste anchor — this MUST update
        // focus state (React-side), not just selection.
        await app.rowAt(0).click({ position: { x: 5, y: 5 } });

        // Move DOM focus to the listbox so Cmd+V is handled by the listbox
        // keydown handler (it skips when DOM focus is inside an INPUT).
        await app.page.locator('[role="listbox"]').focus();

        // Paste via Cmd+V.
        await app.page.keyboard.press(`${mod}+v`);

        // Clipboard was [G, C, F]; paste at row 0 must overwrite rows 0,1,2.
        await expect(app.chordInputAt(0)).toHaveValue('G');
        await expect(app.chordInputAt(1)).toHaveValue('C');
        await expect(app.chordInputAt(2)).toHaveValue('F');
        // Rows 3 and 4 untouched by paste (still empty / original).
        await expect(app.chordInputAt(3)).toHaveValue('');
        await expect(app.chordInputAt(4)).toHaveValue('Em');
    });
});
