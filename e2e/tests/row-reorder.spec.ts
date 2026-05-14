import { test, expect } from '../fixtures/chord-sheet-app';

const FIVE_ROWS = '[Am]verse one\n[G]verse two\n[C]chorus\n[F]bridge\n[Em]outro';

async function chordAt(app: { chordInputAt: (i: number) => { inputValue: () => Promise<string> } }, i: number): Promise<string> {
    return app.chordInputAt(i).inputValue();
}

test.describe('Row reorder (drag-and-drop)', () => {
    test.beforeEach(async ({ app }) => {
        await app.pasteLyricsViaButton(FIVE_ROWS);
        await app.rowAt(0).waitFor({ state: 'visible' });
    });

    // ── Mouse drag (HTML5 native DnD events) ────────────────────────────────

    /**
     * Fire native HTML5 DnD events on the row at `fromIndex` over the row at `toIndex`.
     * Drops in the lower half (position='after') by default.
     */
    async function dispatchDragAndDrop(
        page: import('@playwright/test').Page,
        fromIndex: number,
        toIndex: number,
        position: 'before' | 'after' = 'after',
    ) {
        // dragstart — split across awaits so React state from onDragStart commits
        // before subsequent dragover/drop are dispatched.
        await page.evaluate((fromIndex) => {
            const rows = Array.from(document.querySelectorAll('[role="option"]'));
            const from = rows[fromIndex] as HTMLElement;
            const dt = new DataTransfer();
            (window as unknown as { __dt__: DataTransfer }).__dt__ = dt;
            from.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: dt }));
        }, fromIndex);
        // dragover + drop in second tick — state has now flushed
        await page.evaluate(
            ({ fromIndex, toIndex, position }) => {
                const rows = Array.from(document.querySelectorAll('[role="option"]'));
                const from = rows[fromIndex] as HTMLElement;
                const to = rows[toIndex] as HTMLElement;
                const dt = (window as unknown as { __dt__: DataTransfer }).__dt__;
                const toRect = to.getBoundingClientRect();
                const clientY =
                    position === 'before'
                        ? toRect.top + toRect.height * 0.25
                        : toRect.top + toRect.height * 0.75;
                to.dispatchEvent(
                    new DragEvent('dragover', {
                        bubbles: true,
                        cancelable: true,
                        dataTransfer: dt,
                        clientY,
                        clientX: toRect.left + toRect.width / 2,
                    }),
                );
                to.dispatchEvent(
                    new DragEvent('drop', {
                        bubbles: true,
                        cancelable: true,
                        dataTransfer: dt,
                        clientY,
                        clientX: toRect.left + toRect.width / 2,
                    }),
                );
                from.dispatchEvent(new DragEvent('dragend', { bubbles: true, dataTransfer: dt }));
            },
            { fromIndex, toIndex, position },
        );
    }

    test('mouse drag row 0 onto row 3 reorders to [1,2,3,0,4]', async ({ app }) => {
        expect(await chordAt(app, 0)).toBe('Am');
        await dispatchDragAndDrop(app.page, 0, 3, 'after');
        // moveRow(0, 3): Am moves from 0 to 3 → G, C, F, Am, Em
        expect(await chordAt(app, 0)).toBe('G');
        expect(await chordAt(app, 1)).toBe('C');
        expect(await chordAt(app, 2)).toBe('F');
        expect(await chordAt(app, 3)).toBe('Am');
        expect(await chordAt(app, 4)).toBe('Em');
    });

    test('mouse drag row 2 onto row 0 upper half reorders C to top', async ({ app }) => {
        await dispatchDragAndDrop(app.page, 2, 0, 'before');
        expect(await chordAt(app, 0)).toBe('C');
        expect(await chordAt(app, 1)).toBe('Am');
        expect(await chordAt(app, 2)).toBe('G');
    });

    // ── Keyboard drag ───────────────────────────────────────────────────────

    test('keyboard drag: Space lifts, ArrowDown twice, Space drops — row 1 → position 3', async ({
        app,
    }) => {
        // Focus the listbox; ArrowDown twice to focus row 1
        await app.page.locator('[role="listbox"]').focus();
        await app.page.keyboard.press('ArrowDown'); // focus 0
        await app.page.keyboard.press('ArrowDown'); // focus 1
        // Lift row 1
        await app.page.keyboard.press(' ');
        // Lifted indicator visible
        await expect(app.rowAt(1)).toHaveClass(/SongTextRowContainer--lifted/);
        // Move target down twice (to row 3)
        await app.page.keyboard.press('ArrowDown');
        await app.page.keyboard.press('ArrowDown');
        // Drop
        await app.page.keyboard.press(' ');

        // Initial: Am, G, C, F, Em → moveRow(1, 3) → Am, C, F, G, Em
        expect(await chordAt(app, 0)).toBe('Am');
        expect(await chordAt(app, 1)).toBe('C');
        expect(await chordAt(app, 2)).toBe('F');
        expect(await chordAt(app, 3)).toBe('G');
        expect(await chordAt(app, 4)).toBe('Em');
    });

    test('keyboard drag: Esc cancels without reordering', async ({ app }) => {
        await app.page.locator('[role="listbox"]').focus();
        await app.page.keyboard.press('ArrowDown'); // focus 0
        await app.page.keyboard.press(' '); // lift row 0
        await expect(app.rowAt(0)).toHaveClass(/SongTextRowContainer--lifted/);
        await app.page.keyboard.press('ArrowDown');
        await app.page.keyboard.press('ArrowDown');
        await app.page.keyboard.press('Escape');
        // Lifted state cleared
        await expect(app.rowAt(0)).not.toHaveClass(/SongTextRowContainer--lifted/);
        // Canonical unchanged
        expect(await chordAt(app, 0)).toBe('Am');
        expect(await chordAt(app, 1)).toBe('G');
        expect(await chordAt(app, 2)).toBe('C');
    });

    test('keyboard drag: single history entry — undo restores in one step', async ({ app }) => {
        await app.page.locator('[role="listbox"]').focus();
        await app.page.keyboard.press('ArrowDown'); // focus 0
        await app.page.keyboard.press(' '); // lift
        // Move target down 3 times — long-distance reorder
        await app.page.keyboard.press('ArrowDown');
        await app.page.keyboard.press('ArrowDown');
        await app.page.keyboard.press('ArrowDown');
        await app.page.keyboard.press(' '); // drop
        // Row moved
        expect(await chordAt(app, 3)).toBe('Am');
        // One undo restores
        await app.undoButton.click();
        expect(await chordAt(app, 0)).toBe('Am');
        expect(await chordAt(app, 3)).toBe('F');
    });
});
