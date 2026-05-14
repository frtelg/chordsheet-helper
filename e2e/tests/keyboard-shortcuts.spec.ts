import { test, expect } from '../fixtures/chord-sheet-app';

const FIVE_ROWS = '[Am]verse one\n[G]verse two\n[C]chorus\n[F]bridge\n[Em]outro';
const mod = process.platform === 'darwin' ? 'Meta' : 'Control';

test.describe('Keyboard shortcuts', () => {
    test.beforeEach(async ({ app }) => {
        await app.pasteLyricsViaButton(FIVE_ROWS);
        await app.rowAt(0).waitFor({ state: 'visible' });
    });

    // ── Focus navigation ────────────────────────────────────────────────────

    test('ArrowDown moves focus to first row; further press moves to second', async ({ app }) => {
        await app.page.locator('[role="listbox"]').focus();
        await app.page.keyboard.press('ArrowDown');
        // Row 0 should now have tabIndex=0 (focused)
        await expect(app.rowAt(0)).toHaveAttribute('tabindex', '0');

        await app.page.keyboard.press('ArrowDown');
        await expect(app.rowAt(1)).toHaveAttribute('tabindex', '0');
        await expect(app.rowAt(0)).toHaveAttribute('tabindex', '-1');
    });

    test('ArrowDown moves DOM focus onto the row option', async ({ app }) => {
        await app.page.locator('[role="listbox"]').focus();
        await app.page.keyboard.press('ArrowDown');
        await expect(app.rowAt(0)).toBeFocused();

        await app.page.keyboard.press('ArrowDown');
        await expect(app.rowAt(1)).toBeFocused();
    });

    test('ArrowUp moves DOM focus onto the row option', async ({ app }) => {
        await app.page.locator('[role="listbox"]').focus();
        await app.page.keyboard.press('ArrowDown');
        await app.page.keyboard.press('ArrowDown');
        await app.page.keyboard.press('ArrowUp');
        await expect(app.rowAt(0)).toBeFocused();
    });

    test('Shift+ArrowDown moves DOM focus onto the row option', async ({ app }) => {
        await app.page.locator('[role="listbox"]').focus();
        await app.page.keyboard.press('ArrowDown'); // focus row 0
        await app.page.keyboard.press('Shift+ArrowDown');
        await expect(app.rowAt(1)).toBeFocused();
    });

    test('Clicking a chord input does not steal focus to the row container', async ({ app }) => {
        await app.chordInputAt(2).click();
        await expect(app.chordInputAt(2)).toBeFocused();
    });

    test('ArrowUp moves focus up', async ({ app }) => {
        await app.page.locator('[role="listbox"]').focus();
        // Move down to row 1 first
        await app.page.keyboard.press('ArrowDown');
        await app.page.keyboard.press('ArrowDown');
        await expect(app.rowAt(1)).toHaveAttribute('tabindex', '0');

        await app.page.keyboard.press('ArrowUp');
        await expect(app.rowAt(0)).toHaveAttribute('tabindex', '0');
    });

    test('ArrowDown clamps at last row', async ({ app }) => {
        await app.page.locator('[role="listbox"]').focus();
        // Press ArrowDown 10 times — should clamp at row 4
        for (let i = 0; i < 10; i++) {
            await app.page.keyboard.press('ArrowDown');
        }
        await expect(app.rowAt(4)).toHaveAttribute('tabindex', '0');
    });

    // ── Shift+Arrow selection extension ────────────────────────────────────

    test('Shift+ArrowDown extends selection range downward', async ({ app }) => {
        // Select row 1 as anchor, then shift+arrow down to add row 2
        await app.selectRow(1);
        await app.page.locator('[role="listbox"]').focus();
        // Move focus to row 1 first
        await app.page.keyboard.press('ArrowDown');
        await app.page.keyboard.press('ArrowDown');
        // Shift+ArrowDown should extend selection to row 2
        await app.page.keyboard.press('Shift+ArrowDown');
        const count = await app.getSelectionPillCount();
        expect(count).toBeGreaterThanOrEqual(2);
        await expect(app.rowAt(2)).toHaveAttribute('aria-selected', 'true');
    });

    test('Shift+ArrowUp extends selection range upward', async ({ app }) => {
        await app.selectRow(2);
        await app.page.locator('[role="listbox"]').focus();
        // Move focus to row 2
        await app.page.keyboard.press('ArrowDown');
        await app.page.keyboard.press('ArrowDown');
        await app.page.keyboard.press('ArrowDown');
        // Shift+ArrowUp should extend selection upward
        await app.page.keyboard.press('Shift+ArrowUp');
        await expect(app.rowAt(1)).toHaveAttribute('aria-selected', 'true');
    });

    // ── Space toggles focused row ──────────────────────────────────────────

    test('Space toggles focused row into selection', async ({ app }) => {
        await app.page.locator('[role="listbox"]').focus();
        await app.page.keyboard.press('ArrowDown'); // focus row 0
        await app.page.keyboard.press(' ');
        await expect(app.rowAt(0)).toHaveAttribute('aria-selected', 'true');
    });

    test('Space toggles focused row out of selection when already selected', async ({ app }) => {
        await app.selectRow(0);
        await expect(app.rowAt(0)).toHaveAttribute('aria-selected', 'true');
        await app.page.locator('[role="listbox"]').focus();
        await app.page.keyboard.press('ArrowDown'); // focus row 0
        await app.page.keyboard.press(' '); // toggle off
        await expect(app.rowAt(0)).toHaveAttribute('aria-selected', 'false');
    });

    // ── Cmd+ArrowDown / Cmd+ArrowUp — chord-only swap ──────────────────────

    test('Cmd+ArrowDown swaps chord value of focused row with row below', async ({ app }) => {
        // Row 0 has 'Am', row 1 has 'G'
        await expect(app.chordInputAt(0)).toHaveValue('Am');
        await expect(app.chordInputAt(1)).toHaveValue('G');

        await app.page.locator('[role="listbox"]').focus();
        await app.page.keyboard.press('ArrowDown'); // focus row 0
        await app.page.keyboard.press(`${mod}+ArrowDown`);

        // After swap: row 0 should have 'G', row 1 should have 'Am'
        await expect(app.chordInputAt(0)).toHaveValue('G');
        await expect(app.chordInputAt(1)).toHaveValue('Am');
        // Row count unchanged
        expect(await app.page.locator('[role="option"]').count()).toBe(5);
    });

    test('Cmd+ArrowUp swaps chord value of focused row with row above', async ({ app }) => {
        // Row 0 has 'Am', row 1 has 'G'
        await app.page.locator('[role="listbox"]').focus();
        await app.page.keyboard.press('ArrowDown');
        await app.page.keyboard.press('ArrowDown'); // focus row 1
        await app.page.keyboard.press(`${mod}+ArrowUp`);

        // After swap: row 0 should have 'G', row 1 should have 'Am'
        await expect(app.chordInputAt(0)).toHaveValue('G');
        await expect(app.chordInputAt(1)).toHaveValue('Am');
        expect(await app.page.locator('[role="option"]').count()).toBe(5);
    });

    test('Cmd+ArrowDown at bottom row is a no-op', async ({ app }) => {
        await app.page.locator('[role="listbox"]').focus();
        // Navigate to last row (row 4)
        for (let i = 0; i < 5; i++) {
            await app.page.keyboard.press('ArrowDown');
        }
        const chordBefore = await app.chordInputAt(4).inputValue();
        await app.page.keyboard.press(`${mod}+ArrowDown`);
        // Chord should be unchanged
        await expect(app.chordInputAt(4)).toHaveValue(chordBefore);
    });

    // ── Cmd+C — copy chord values ──────────────────────────────────────────

    test('Cmd+C copies selected chord values to clipboard state', async ({ app }) => {
        await app.selectRow(0);
        await app.shiftSelectRow(1);
        await app.page.locator('[role="listbox"]').focus();
        await app.page.keyboard.press(`${mod}+c`);

        // After copy, paste at row 2 to verify clipboard contents
        await app.page.keyboard.press('ArrowDown');
        await app.page.keyboard.press('ArrowDown');
        await app.page.keyboard.press('ArrowDown'); // focus row 2
        await app.page.keyboard.press(`${mod}+v`);

        // Row 2 should now have 'Am' (first copied chord)
        await expect(app.chordInputAt(2)).toHaveValue('Am');
        // Row 3 should have 'G' (second copied chord)
        await expect(app.chordInputAt(3)).toHaveValue('G');
    });

    // ── Cmd+X — cut chord values ──────────────────────────────────────────

    test('Cmd+X clears chord values from selected rows and shows snackbar', async ({ app }) => {
        await app.selectRow(0);
        await app.shiftSelectRow(1);
        await app.page.locator('[role="listbox"]').focus();
        await app.page.keyboard.press(`${mod}+x`);

        await expect(app.chordInputAt(0)).toHaveValue('');
        await expect(app.chordInputAt(1)).toHaveValue('');
        // Lines not deleted
        expect(await app.page.locator('[role="option"]').count()).toBe(5);
        // Snackbar shown
        await expect(app.snackbar).toBeVisible();
        await expect(app.page.getByText('Cut 2 chords')).toBeVisible();
    });

    // ── Cmd+V — paste chord values ──────────────────────────────────────────

    test('Cmd+V pastes clipboard at focused row', async ({ app }) => {
        // Copy rows 0 and 1
        await app.selectRow(0);
        await app.shiftSelectRow(1);
        await app.clickActionBarButton('Copy chord values');
        await app.clearSelection();

        // Focus row 3 via arrow keys, then paste
        await app.page.locator('[role="listbox"]').focus();
        for (let i = 0; i < 4; i++) {
            await app.page.keyboard.press('ArrowDown');
        }
        await expect(app.rowAt(3)).toHaveAttribute('tabindex', '0');
        await app.page.keyboard.press(`${mod}+v`);

        await expect(app.chordInputAt(3)).toHaveValue('Am');
        await expect(app.chordInputAt(4)).toHaveValue('G');
        // Snackbar shown
        await expect(app.snackbar).toBeVisible();
    });
});
