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
