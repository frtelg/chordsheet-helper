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

    test('declines extraction: raw text stays in textarea, chord inputs are empty', async ({
        app,
    }) => {
        await app.pasteLyricsWithModal(SONG_WITH_CHORDS);
        await app.declineChordExtraction();

        await expect(app.lyricsTextarea).toHaveValue(SONG_WITH_CHORDS);

        const chordInputCount = await app.page.locator('.ChordInput').count();
        for (let i = 0; i < chordInputCount; i++) {
            await expect(app.chordInputAt(i)).toHaveValue('');
        }
    });
});
