import { test as base, Page } from '@playwright/test';

export class ChordSheetApp {
    constructor(readonly page: Page) {}

    // --- Locators ---

    get lyricsTextarea() {
        return this.page.getByPlaceholder('Enter or paste song lyrics here');
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

    chordInputAt(index: number) {
        return this.page.locator('.ChordInput').nth(index);
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
}

export const test = base.extend<{ app: ChordSheetApp }>({
    app: async ({ page }, use) => {
        await page.goto('/');
        await use(new ChordSheetApp(page));
    },
});

export { expect } from '@playwright/test';
