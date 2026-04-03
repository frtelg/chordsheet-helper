import { test, expect } from '../fixtures/chord-sheet-app';
import {
    SONG_WITH_CHORDS,
    EXTRACTED_CHORD_ROW_0,
    EXTRACTED_CHORD_ROW_1,
    EXTRACTED_LYRIC_0,
    EXTRACTED_LYRIC_1,
    EXPECTED_KEY_AFTER_EXTRACTION,
} from '../test-data/songs';

test.describe('Submit and result view', () => {
    test.beforeEach(async ({ app }) => {
        await app.pasteLyricsWithModal(SONG_WITH_CHORDS);
        await app.acceptChordExtraction();
        await app.submitChanges();
    });

    test('switches to result view', async ({ app }) => {
        await expect(app.resultView).toBeVisible();
        await expect(app.chordEditor).not.toBeVisible();
    });

    test('result view displays detected key', async ({ app }) => {
        await expect(app.chordSheetText).toContainText(`Key: ${EXPECTED_KEY_AFTER_EXTRACTION}`);
    });

    test('chord lines in result preserve exact spacing above lyrics', async ({ app }) => {
        const chordLines = app.page.locator('.ChordSheetText b');

        // Each chord line must exactly match the original string, including all spaces
        await expect(chordLines.nth(0)).toHaveText(EXTRACTED_CHORD_ROW_0);
        await expect(chordLines.nth(1)).toHaveText(EXTRACTED_CHORD_ROW_1);
    });

    test('lyric lines appear in result view', async ({ app }) => {
        await expect(app.chordSheetText).toContainText(EXTRACTED_LYRIC_0);
        await expect(app.chordSheetText).toContainText(EXTRACTED_LYRIC_1);
    });

    test('edit button returns to editor with chords preserved', async ({ app }) => {
        await app.editButton.click();

        await expect(app.chordEditor).toBeVisible();
        await expect(app.resultView).not.toBeVisible();

        await expect(app.chordInputAt(0)).toHaveValue(EXTRACTED_CHORD_ROW_0);
        await expect(app.chordInputAt(1)).toHaveValue(EXTRACTED_CHORD_ROW_1);
    });

    test('download link uses the first lyric line as filename', async ({ app }) => {
        const downloadLink = app.page.getByRole('link', { name: 'Download as file' });
        await expect(downloadLink).toBeVisible();

        // The link uses a blob URL with the download attribute — check the attribute directly
        await expect(downloadLink).toHaveAttribute('download', `${EXTRACTED_LYRIC_0}.txt`);
    });
});
