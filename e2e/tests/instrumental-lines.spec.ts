import { test, expect } from '../fixtures/chord-sheet-app';
import {
    SONG_WITH_INSTRUMENTAL,
    INSTRUMENTAL_CHORD_ROW,
    INSTRUMENTAL_BRACKETED_ROW,
    VERSE_CHORD_ROW_0,
    VERSE_LYRIC_ROW_0,
} from '../test-data/songs';

test.describe('Instrumental chord lines', () => {
    test.beforeEach(async ({ app }) => {
        await app.pasteLyricsWithModal(SONG_WITH_INSTRUMENTAL);
        await app.acceptChordExtraction();
    });

    test('instrumental bar lines appear as chord rows', async ({ app }) => {
        await expect(app.chordInputAt(0)).toHaveValue(INSTRUMENTAL_CHORD_ROW);
        await expect(app.chordInputAt(1)).toHaveValue(INSTRUMENTAL_CHORD_ROW);
    });

    test('instrumental rows have no lyric input beside them', async ({ app }) => {
        const rows = app.page.locator('.SongTextRowContainer');

        // Rows 0 and 1 are instrumental — no lyric input should be rendered
        await expect(rows.nth(0).locator('.LyricInputContainer input')).toHaveCount(0);
        await expect(rows.nth(1).locator('.LyricInputContainer input')).toHaveCount(0);
    });

    test('normal verse rows below instrumental section show lyric inputs', async ({ app }) => {
        await expect(app.chordInputAt(2)).toHaveValue(VERSE_CHORD_ROW_0);

        const rows = app.page.locator('.SongTextRowContainer');
        const lyricInput = rows.nth(2).locator('.LyricInputContainer input');
        await expect(lyricInput).toBeVisible();
        await expect(lyricInput).toHaveValue(VERSE_LYRIC_ROW_0);
    });

    test('result view: chords-over-lyrics preserves bar notation', async ({ app }) => {
        await app.submitChanges();

        await expect(app.chordSheetText).toContainText(INSTRUMENTAL_CHORD_ROW);
    });

    test('result view: bracketed format wraps chords in bar notation', async ({ app }) => {
        await app.submitChanges();
        await app.bracketedFormatToggle.check();

        await expect(app.chordSheetText).toContainText(INSTRUMENTAL_BRACKETED_ROW);
    });
});
