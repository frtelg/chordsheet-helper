import { test, expect } from '../fixtures/chord-sheet-app';
import {
    SONG_WITH_CHORDS,
    EXTRACTED_CHORD_ROW_0,
    EXTRACTED_CHORD_ROW_1,
} from '../test-data/songs';

test.describe('Row operations', () => {
    // Use chord-extraction flow so chords are proper strings (not undefined holes)
    test.beforeEach(async ({ app }) => {
        await app.pasteLyricsWithModal(SONG_WITH_CHORDS);
        await app.acceptChordExtraction();
    });

    test('move down shifts current row chords to the next row', async ({ app }) => {
        // Row 0 starts with EXTRACTED_CHORD_ROW_0
        await expect(app.chordInputAt(0)).toHaveValue(EXTRACTED_CHORD_ROW_0);

        await app.page.getByRole('img', { name: 'Move down from here' }).first().click();

        // Row 0 should now be empty (chord was pushed down)
        await expect(app.chordInputAt(0)).toHaveValue('');
        // Row 1 should now have what row 0 had
        await expect(app.chordInputAt(1)).toHaveValue(EXTRACTED_CHORD_ROW_0);
    });

    test('move up removes the preceding chord row for the current row', async ({ app }) => {
        // Both rows start with extracted chords
        await expect(app.chordInputAt(0)).toHaveValue(EXTRACTED_CHORD_ROW_0);
        await expect(app.chordInputAt(1)).toHaveValue(EXTRACTED_CHORD_ROW_1);

        // Move up on row 1 removes the chord at position 0
        await app.page.getByRole('img', { name: 'Move up from here' }).nth(1).click();

        // Row 0 should now have what row 1 had (preceding chord was removed)
        await expect(app.chordInputAt(0)).toHaveValue(EXTRACTED_CHORD_ROW_1);
    });

    test('copy chords button is present on each row', async ({ app }) => {
        await expect(app.page.getByRole('img', { name: 'Copy chords' }).first()).toBeVisible();
    });
});
