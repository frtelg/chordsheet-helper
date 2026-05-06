import { test as base, Page } from '@playwright/test';

export class ChordSheetApp {
    constructor(readonly page: Page) {}

    // --- Locators ---

    get lyricsTextarea() {
        return this.page.getByPlaceholder('Paste or type your song lyrics here…');
    }

    get modal() {
        return this.page.locator('.ProcessChordLinesModal');
    }

    get chordEditor() {
        return this.page.locator('.ChordSheetEditor');
    }

    get resultView() {
        return this.page.locator('.ChordSheetResult');
    }

    get chordSheetText() {
        return this.page.locator('.ChordSheetText');
    }

    get submitButton() {
        return this.page.getByRole('button', { name: 'Submit changes' });
    }

    get editButton() {
        return this.page.getByRole('button', { name: 'Edit' });
    }

    get resetButton() {
        return this.page.getByRole('button', { name: 'Reset' });
    }

    get transposeUpButton() {
        return this.page.getByRole('img', { name: 'Transpose up' });
    }

    get transposeDownButton() {
        return this.page.getByRole('img', { name: 'Transpose down' });
    }

    get undoButton() {
        return this.page.getByRole('img', { name: 'Undo last action' });
    }

    get keyDisplay() {
        return this.page.locator('.Transposer');
    }

    get editLyricsCheckbox() {
        return this.page.locator('.HelpersBar input[type="checkbox"]');
    }

    /** Result-view format toggle (checkbox in ChordSheetResult). */
    get bracketedFormatToggle() {
        return this.page.locator('.FormatToggle input[type="checkbox"]');
    }

    /** Editor-side "Bracketed" format button in SongTextInput toolbar. */
    get editorBracketedButton() {
        return this.page.getByRole('button', { name: 'Bracketed', exact: true });
    }

    /** Editor-side "Chords over lyrics" format button in SongTextInput toolbar. */
    get editorOverLyricsButton() {
        return this.page.getByRole('button', { name: 'Chords over lyrics', exact: true });
    }

    chordInputAt(index: number) {
        return this.page.locator('.ChordInput').nth(index);
    }

    /** New UX: nth row (role="option") */
    rowAt(index: number) {
        return this.page.locator('[role="option"]').nth(index);
    }

    /** New UX: Selection action bar */
    get selectionActionBar() {
        return this.page.locator('.SelectionActionBar');
    }

    /** New UX: Selection pill showing count */
    get selectionPill() {
        return this.page.locator('.SelectionPill');
    }

    /** New UX: Snackbar */
    get snackbar() {
        return this.page.locator('.Snackbar');
    }

    // --- Actions ---

    /**
     * Paste lyrics using the "Paste from clipboard" button.
     * Writes text to clipboard then clicks the button — this dispatches to Redux directly
     * and waits for the editor to appear.
     */
    async pasteLyricsViaButton(text: string) {
        await this.page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
        await this.page.evaluate((t) => navigator.clipboard.writeText(t), text);
        await this.page.getByRole('button', { name: 'Paste from clipboard' }).click();
        await this.chordEditor.waitFor({ state: 'visible' });
    }

    /**
     * Fill the lyrics textarea directly — triggers chord extraction modal when
     * the input contains chord-only lines.
     */
    async pasteLyricsWithModal(text: string) {
        await this.lyricsTextarea.fill(text);
        await this.modal.waitFor({ state: 'visible' });
    }

    /**
     * Type a chord string into the row at `index` and blur the input so
     * Redux state is updated (the custom Input component dispatches on blur).
     */
    async enterChordAtRow(index: number, chord: string) {
        const input = this.chordInputAt(index);
        await input.fill(chord);
        await input.blur();
    }

    async acceptChordExtraction() {
        await this.page.getByRole('button', { name: 'Yes' }).click();
        await this.chordEditor.waitFor({ state: 'visible' });
    }

    async declineChordExtraction() {
        await this.page.getByRole('button', { name: 'No, thanks' }).click();
    }

    async submitChanges() {
        await this.submitButton.click();
        await this.resultView.waitFor({ state: 'visible' });
    }

    // --- New UX helpers ---

    /**
     * Select a row by dispatching to the Redux store via window.__store__.
     * More reliable than clicking (avoids hitting chord/lyric inputs).
     */
    async selectRow(index: number) {
        const row = this.rowAt(index);
        // Get the sourceLineIndex from aria-* or fallback to row index
        await this.page.evaluate((rowIndex: number) => {
            const store = (window as Record<string, unknown>).__store__ as {
                dispatch: (action: { type: string; payload: unknown }) => void;
                getState: () => { canonical: { selected: unknown } };
            };
            store.dispatch({ type: 'canonical/setSelected', payload: { index: rowIndex, mode: 'single' } });
        }, index);
        await row.waitFor({ state: 'visible' });
    }

    /** Shift-click a row to extend the selection from anchor. */
    async shiftSelectRow(index: number) {
        await this.page.evaluate((rowIndex: number) => {
            const store = (window as Record<string, unknown>).__store__ as {
                dispatch: (action: { type: string; payload: unknown }) => void;
            };
            store.dispatch({ type: 'canonical/setSelected', payload: { index: rowIndex, mode: 'range' } });
        }, index);
    }

    /** Cmd/Ctrl-click a row to toggle it in/out of the selection. */
    async cmdSelectRow(index: number) {
        await this.page.evaluate((rowIndex: number) => {
            const store = (window as Record<string, unknown>).__store__ as {
                dispatch: (action: { type: string; payload: unknown }) => void;
            };
            store.dispatch({ type: 'canonical/setSelected', payload: { index: rowIndex, mode: 'toggle' } });
        }, index);
    }

    /**
     * Open the kebab menu for `rowIndex` and click `itemName`.
     * Hovers over the row first so the kebab becomes visible.
     */
    async clickKebabMenuItem(rowIndex: number, itemName: string) {
        const row = this.rowAt(rowIndex);
        // Hover the row so KebabMenu--visible class is added (opacity 0→1)
        await row.hover();
        // Wait for the KebabTrigger to become visible (opacity transition ~100ms)
        const trigger = row.locator('.KebabTrigger');
        await trigger.waitFor({ state: 'visible' });
        await trigger.click();
        await this.page.getByRole('menuitem', { name: itemName }).click();
    }

    /**
     * Clear all selected rows via the Redux store.
     */
    async clearSelection() {
        await this.page.evaluate(() => {
            const store = (window as Record<string, unknown>).__store__ as {
                dispatch: (action: { type: string }) => void;
            };
            store.dispatch({ type: 'canonical/clearSelected' });
        });
    }

    /**
     * Read the numeric count from the SelectionPill (e.g. "3 rows selected" → 3).
     */
    async getSelectionPillCount(): Promise<number> {
        const text = await this.selectionPill.textContent();
        const match = text?.match(/(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
    }

    /**
     * Click a button in the SelectionActionBar by its title attribute.
     */
    async clickActionBarButton(title: string) {
        await this.page.locator(`.SelectionBarButton[title="${title}"]`).click();
    }
}

export const test = base.extend<{ app: ChordSheetApp }>({
    app: async ({ page }, use) => {
        await page.goto('/');
        await use(new ChordSheetApp(page));
    },
});

export { expect } from '@playwright/test';
