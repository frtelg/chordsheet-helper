import { test, expect } from '../fixtures/chord-sheet-app';
import {
    SONG_WITH_CHORDS,
    EXTRACTED_CHORD_ROW_0,
    EXTRACTED_CHORD_ROW_1,
    EXPECTED_KEY_AFTER_EXTRACTION,
} from '../test-data/songs';

test.describe('Paste lyrics containing chord lines', () => {
    test('shows the chord extraction modal', async ({ app }) => {
        await app.pasteLyricsWithModal(SONG_WITH_CHORDS);

        await expect(app.modal).toBeVisible();
    });

    test('accepts extraction: editor shows chord inputs populated with correct spacing', async ({
        app,
    }) => {
        await app.pasteLyricsWithModal(SONG_WITH_CHORDS);
        await app.acceptChordExtraction();

        await expect(app.chordEditor).toBeVisible();

        // Chord inputs must contain the exact chord strings, preserving all spacing
        await expect(app.chordInputAt(0)).toHaveValue(EXTRACTED_CHORD_ROW_0);
        await expect(app.chordInputAt(1)).toHaveValue(EXTRACTED_CHORD_ROW_1);

        // Key is detected from the extracted chords
        await expect(app.keyDisplay).toContainText(`Key: ${EXPECTED_KEY_AFTER_EXTRACTION}`);
    });

    test('declines extraction: raw text stays in textarea', async ({
        app,
    }) => {
        await app.pasteLyricsWithModal(SONG_WITH_CHORDS);
        await app.declineChordExtraction();

        // Declining keeps the raw chords-over-lyrics text in the textarea.
        await expect(app.lyricsTextarea).toHaveValue(SONG_WITH_CHORDS);

        // In the new canonical model, chord-only lines are still recognised as
        // instrumental rows — so chord inputs are populated (not empty).
        await expect(app.chordInputAt(0)).toHaveValue(EXTRACTED_CHORD_ROW_0);
    });
});
