import { test, expect } from '../fixtures/chord-sheet-app';
import {
    SINGLE_LINE_LYRICS,
    TRANSPOSE_CHORDS,
    TRANSPOSE_CHORDS_UP_1,
    TRANSPOSE_EXPECTED_KEY,
} from '../test-data/songs';

test.describe('Transpose chords', () => {
    test.beforeEach(async ({ app }) => {
        await app.pasteLyricsViaButton(SINGLE_LINE_LYRICS);
        await app.enterChordAtRow(0, TRANSPOSE_CHORDS);
        await expect(app.keyDisplay).toContainText(`Key: ${TRANSPOSE_EXPECTED_KEY}`);
    });

    test('transpose up changes all chords by one semitone', async ({ app }) => {
        await app.transposeUpButton.click();

        await expect(app.chordInputAt(0)).toHaveValue(TRANSPOSE_CHORDS_UP_1);
    });

    test('transpose down after transpose up reverts to original chords', async ({ app }) => {
        await app.transposeUpButton.click();
        await app.transposeDownButton.click();

        await expect(app.chordInputAt(0)).toHaveValue(TRANSPOSE_CHORDS);
        await expect(app.keyDisplay).toContainText(`Key: ${TRANSPOSE_EXPECTED_KEY}`);
    });

    test('transposed chords appear correctly in result view', async ({ app }) => {
        await app.transposeUpButton.click();
        await app.submitChanges();

        await expect(app.page.locator('.ChordSheetText b').first()).toHaveText(
            TRANSPOSE_CHORDS_UP_1
        );
    });
});
