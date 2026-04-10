import { test, expect } from '../fixtures/chord-sheet-app';
import { SONG_WITH_CHORDS, EXTRACTED_LYRIC_0 } from '../test-data/songs';

test.describe('OnSong format toggle', () => {
    test.beforeEach(async ({ app }) => {
        await app.pasteLyricsWithModal(SONG_WITH_CHORDS);
        await app.acceptChordExtraction();
        await app.submitChanges();
    });

    test('format toggle is visible in result view', async ({ app }) => {
        await expect(app.bracketedFormatToggle).toBeVisible();
    });

    test('default format is chords-over-lyrics — chord lines render bold', async ({ app }) => {
        await expect(app.bracketedFormatToggle).not.toBeChecked();
        const chordLines = app.page.locator('.ChordSheetText b');
        await expect(chordLines.first()).toBeVisible();
    });

    test('switching to bracketed removes bold chord lines', async ({ app }) => {
        await app.bracketedFormatToggle.check();
        await expect(app.bracketedFormatToggle).toBeChecked();

        const chordLines = app.page.locator('.ChordSheetText b');
        await expect(chordLines).toHaveCount(0);
    });

    test('bracketed format shows inline chord brackets in preview', async ({ app }) => {
        await app.bracketedFormatToggle.check();
        // First chord G should appear inline with the lyric
        await expect(app.chordSheetText).toContainText('[G]');
    });

    test('bracketed mode still shows lyric text', async ({ app }) => {
        await app.bracketedFormatToggle.check();
        // In bracketed mode the lyric is split by chord brackets — check a fragment
        // that appears intact: "Amazing grac" precedes the first [D] insertion
        await expect(app.chordSheetText).toContainText('Amazing grac');
    });

    test('switching back to chords-over-lyrics restores bold chord lines', async ({ app }) => {
        await app.bracketedFormatToggle.check();
        await app.bracketedFormatToggle.uncheck();

        await expect(app.bracketedFormatToggle).not.toBeChecked();
        const chordLines = app.page.locator('.ChordSheetText b');
        await expect(chordLines.first()).toBeVisible();
    });
});
