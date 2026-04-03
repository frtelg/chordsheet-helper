import { test, expect } from '../fixtures/chord-sheet-app';
import {
    SINGLE_LINE_LYRICS,
    UNDO_CHORDS,
    UNDO_CHORDS_TRANSPOSED,
    UNDO_EXPECTED_KEY,
} from '../test-data/songs';

test.describe('Undo', () => {
    test.beforeEach(async ({ app }) => {
        await app.pasteLyricsViaButton(SINGLE_LINE_LYRICS);
        await app.enterChordAtRow(0, UNDO_CHORDS);
        await expect(app.keyDisplay).toContainText(`Key: ${UNDO_EXPECTED_KEY}`);
    });

    test('undo reverts a transpose', async ({ app }) => {
        await app.transposeUpButton.click();
        await expect(app.chordInputAt(0)).toHaveValue(UNDO_CHORDS_TRANSPOSED);

        await app.undoButton.click();

        await expect(app.chordInputAt(0)).toHaveValue(UNDO_CHORDS);
        await expect(app.keyDisplay).toContainText(`Key: ${UNDO_EXPECTED_KEY}`);
    });

    test('undo reverts a manually typed chord change', async ({ app }) => {
        await app.enterChordAtRow(0, 'Em  Am  D  G');
        await app.undoButton.click();

        await expect(app.chordInputAt(0)).toHaveValue(UNDO_CHORDS);
    });
});
