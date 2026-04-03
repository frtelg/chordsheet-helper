import { test, expect } from '../fixtures/chord-sheet-app';
import { SONG_WITHOUT_CHORDS, EXTRACTED_LYRIC_0 } from '../test-data/songs';

test.describe('Edit lyrics toggle', () => {
    test.beforeEach(async ({ app }) => {
        await app.pasteLyricsViaButton(SONG_WITHOUT_CHORDS);
    });

    test('lyric inputs are disabled by default', async ({ app }) => {
        const lyricInput = app.page.locator('.LyricInputContainer input').first();
        await expect(lyricInput).toBeDisabled();
    });

    test('checking "Enable edit lyrics" enables lyric inputs', async ({ app }) => {
        await app.editLyricsCheckbox.check();

        const lyricInput = app.page.locator('.LyricInputContainer input').first();
        await expect(lyricInput).toBeEnabled();
    });

    test('edited lyric is reflected in result view', async ({ app }) => {
        await app.editLyricsCheckbox.check();

        const lyricInput = app.page.locator('.LyricInputContainer input').first();
        await lyricInput.fill('Edited lyric line');
        await lyricInput.blur();

        await app.submitChanges();

        await expect(app.chordSheetText).toContainText('Edited lyric line');
        await expect(app.chordSheetText).not.toContainText(EXTRACTED_LYRIC_0);
    });
});
