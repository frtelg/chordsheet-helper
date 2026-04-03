import { test, expect } from '../fixtures/chord-sheet-app';
import { SONG_WITHOUT_CHORDS, EXTRACTED_CHORD_ROW_0, TRANSPOSE_EXPECTED_KEY } from '../test-data/songs';

test.describe('Manual chord entry', () => {
    test.beforeEach(async ({ app }) => {
        await app.pasteLyricsViaButton(SONG_WITHOUT_CHORDS);
    });

    test('no modal when pasting plain lyrics', async ({ app }) => {
        await expect(app.modal).not.toBeVisible();
        await expect(app.chordEditor).toBeVisible();
    });

    test('chord inputs start empty', async ({ app }) => {
        const chordInputCount = await app.page.locator('.ChordInput').count();
        expect(chordInputCount).toBeGreaterThan(0);

        for (let i = 0; i < chordInputCount; i++) {
            await expect(app.chordInputAt(i)).toHaveValue('');
        }
    });

    test('entered chords preserve multiple spaces', async ({ app }) => {
        await app.enterChordAtRow(0, EXTRACTED_CHORD_ROW_0);

        await expect(app.chordInputAt(0)).toHaveValue(EXTRACTED_CHORD_ROW_0);
    });

    test('key is detected after entering chords', async ({ app }) => {
        await app.enterChordAtRow(0, 'C  F  G');

        await expect(app.keyDisplay).toContainText(`Key: ${TRANSPOSE_EXPECTED_KEY}`);
    });
});
