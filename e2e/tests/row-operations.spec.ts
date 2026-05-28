import { test, expect } from '../fixtures/chord-sheet-app';

// Three-row bracketed canonical — no modal, no chord extraction.
const THREE_ROWS = '[Am]verse one\n[G]verse two\n[F]verse three';

test.describe('Row operations — symmetric swap', () => {
    test.beforeEach(async ({ app }) => {
        await app.pasteLyricsViaButton(THREE_ROWS);
        // Wait for at least one row to appear
        await app.rowAt(0).waitFor({ state: 'visible' });
    });

    test('move down on row 0 swaps rows 0 and 1', async ({ app }) => {
        // Row 0 starts with Am, row 1 with G
        await expect(app.chordInputAt(0)).toHaveValue('Am');
        await expect(app.chordInputAt(1)).toHaveValue('G');

        await app.clickKebabMenuItem(0, 'Move down');

        // After swap: row 0 → G, row 1 → Am
        await expect(app.chordInputAt(0)).toHaveValue('G');
        await expect(app.chordInputAt(1)).toHaveValue('Am');
        // Row 2 unchanged
        await expect(app.chordInputAt(2)).toHaveValue('F');
    });

    test('move up on row 1 swaps rows 0 and 1', async ({ app }) => {
        await expect(app.chordInputAt(0)).toHaveValue('Am');
        await expect(app.chordInputAt(1)).toHaveValue('G');

        await app.clickKebabMenuItem(1, 'Move up');

        // After swap: row 0 → G, row 1 → Am
        await expect(app.chordInputAt(0)).toHaveValue('G');
        await expect(app.chordInputAt(1)).toHaveValue('Am');
        // Row 2 unchanged
        await expect(app.chordInputAt(2)).toHaveValue('F');
    });

    test('move down and move up are inverses — canonical is restored', async ({ app }) => {
        await app.clickKebabMenuItem(0, 'Move down');
        await app.clickKebabMenuItem(1, 'Move up');

        // Back to original order
        await expect(app.chordInputAt(0)).toHaveValue('Am');
        await expect(app.chordInputAt(1)).toHaveValue('G');
        await expect(app.chordInputAt(2)).toHaveValue('F');
    });

    test('move up at boundary (row 0) is a no-op — Move up is disabled', async ({ app }) => {
        // The Move up menu item for row 0 should be disabled
        const row0 = app.rowAt(0);
        await row0.hover();
        await row0.locator('.KebabTrigger').waitFor({ state: 'visible' });
        await row0.locator('.KebabTrigger').click();
        await expect(app.page.getByRole('menuitem', { name: 'Move up' })).toBeDisabled();
        await app.page.keyboard.press('Escape');
    });

    test('move down at boundary (last row) is a no-op — Move down is disabled', async ({ app }) => {
        const row2 = app.rowAt(2);
        await row2.hover();
        await row2.locator('.KebabTrigger').waitFor({ state: 'visible' });
        await row2.locator('.KebabTrigger').click();
        await expect(app.page.getByRole('menuitem', { name: 'Move down' })).toBeDisabled();
        await app.page.keyboard.press('Escape');
    });
});
