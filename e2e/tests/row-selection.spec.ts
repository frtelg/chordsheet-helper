import { test, expect } from '../fixtures/chord-sheet-app';

const FIVE_ROWS = '[Am]verse one\n[G]verse two\n[C]chorus\n[F]bridge\n[Em]outro';

test.describe('Row selection', () => {
    test.beforeEach(async ({ app }) => {
        await app.pasteLyricsViaButton(FIVE_ROWS);
        await app.rowAt(0).waitFor({ state: 'visible' });
    });

    test('selecting a row marks it aria-selected', async ({ app }) => {
        await app.selectRow(1);
        await expect(app.rowAt(1)).toHaveAttribute('aria-selected', 'true');
        await expect(app.rowAt(0)).toHaveAttribute('aria-selected', 'false');
    });

    test('selection pill shows correct count after single select', async ({ app }) => {
        await app.selectRow(2);
        await expect(app.selectionPill).toBeVisible();
        const count = await app.getSelectionPillCount();
        expect(count).toBe(1);
    });

    test('selection action bar appears when rows are selected', async ({ app }) => {
        await expect(app.selectionActionBar).not.toBeVisible();
        await app.selectRow(0);
        await expect(app.selectionActionBar).toBeVisible();
    });

    test('shift-select extends range from anchor', async ({ app }) => {
        await app.selectRow(0);
        await app.shiftSelectRow(2);
        const count = await app.getSelectionPillCount();
        expect(count).toBe(3);
        await expect(app.rowAt(0)).toHaveAttribute('aria-selected', 'true');
        await expect(app.rowAt(1)).toHaveAttribute('aria-selected', 'true');
        await expect(app.rowAt(2)).toHaveAttribute('aria-selected', 'true');
    });

    test('cmd-click toggles non-contiguous rows', async ({ app }) => {
        await app.selectRow(0);
        await app.cmdSelectRow(2);
        await app.cmdSelectRow(4);
        const count = await app.getSelectionPillCount();
        expect(count).toBe(3);
        await expect(app.rowAt(0)).toHaveAttribute('aria-selected', 'true');
        await expect(app.rowAt(1)).toHaveAttribute('aria-selected', 'false');
        await expect(app.rowAt(2)).toHaveAttribute('aria-selected', 'true');
        await expect(app.rowAt(3)).toHaveAttribute('aria-selected', 'false');
        await expect(app.rowAt(4)).toHaveAttribute('aria-selected', 'true');
    });

    test('Esc clears selection', async ({ app }) => {
        await app.selectRow(1);
        await expect(app.selectionActionBar).toBeVisible();
        // Focus the listbox so keyboard events are dispatched there
        await app.page.locator('[role="listbox"]').focus();
        await app.page.keyboard.press('Escape');
        await expect(app.selectionActionBar).not.toBeVisible();
        await expect(app.rowAt(1)).toHaveAttribute('aria-selected', 'false');
    });

    test('Cmd+A selects all rows', async ({ app }) => {
        // Focus the listbox first by clicking the chord editor
        await app.chordEditor.click();
        const mod = process.platform === 'darwin' ? 'Meta' : 'Control';
        await app.page.keyboard.press(`${mod}+a`);
        const count = await app.getSelectionPillCount();
        expect(count).toBe(5);
    });

    test('selection pill shows N rows selected', async ({ app }) => {
        await app.selectRow(0);
        await app.shiftSelectRow(3);
        const text = await app.selectionPill.textContent();
        expect(text).toContain('4');
    });
});
