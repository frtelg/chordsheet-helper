import { test, expect } from '../fixtures/chord-sheet-app';
import { SONG_WITHOUT_CHORDS } from '../test-data/songs';

test.describe('Reset', () => {
    test.beforeEach(async ({ app }) => {
        await app.pasteLyricsViaButton(SONG_WITHOUT_CHORDS);
    });

    test('clears the lyrics textarea', async ({ app }) => {
        await app.resetButton.click();

        await expect(app.lyricsTextarea).toHaveValue('');
    });

    test('hides the chord editor', async ({ app }) => {
        await expect(app.chordEditor).toBeVisible();

        await app.resetButton.click();

        await expect(app.chordEditor).not.toBeVisible();
    });

    test('allows fresh input after reset', async ({ app }) => {
        await app.resetButton.click();
        await app.pasteLyricsViaButton(SONG_WITHOUT_CHORDS);

        await expect(app.chordEditor).toBeVisible();
    });
});
