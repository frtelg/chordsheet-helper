import { test, expect } from '../fixtures/chord-sheet-app';
import { SINGLE_LINE_LYRICS, TRANSPOSE_CHORDS, TRANSPOSE_CHORDS_UP_1 } from '../test-data/songs';

test.describe('Bidirectional sync', () => {
    test('right-side chord edit appears as bracketed notation in left textarea', async ({ app }) => {
        await app.pasteLyricsViaButton(SINGLE_LINE_LYRICS);

        // Enter a chord on the right side
        await app.enterChordAtRow(0, 'Am');

        // Left textarea should now show the bracketed canonical string
        const value = await app.lyricsTextarea.inputValue();
        expect(value).toContain('[Am]');
        expect(value).toContain('Amazing grace');
    });

    test('format toggle: bracketed ↔ chords-over-lyrics without data loss', async ({ app }) => {
        await app.pasteLyricsViaButton(SINGLE_LINE_LYRICS);
        await app.enterChordAtRow(0, TRANSPOSE_CHORDS);

        // Textarea starts in bracketed mode — should contain [C], [F], [G]
        let value = await app.lyricsTextarea.inputValue();
        expect(value).toContain('[C]');

        // Switch to chords-over-lyrics view
        await app.editorOverLyricsButton.click();
        value = await app.lyricsTextarea.inputValue();
        // Should now show plain chords above the lyric line
        expect(value).toContain(TRANSPOSE_CHORDS);
        expect(value).toContain(SINGLE_LINE_LYRICS);

        // Switch back to bracketed
        await app.editorBracketedButton.click();
        value = await app.lyricsTextarea.inputValue();
        // Should be back to bracket notation — data not lost
        expect(value).toContain('[C]');
    });

    test('transpose updates both left textarea and right chord input', async ({ app }) => {
        await app.pasteLyricsViaButton(SINGLE_LINE_LYRICS);
        await app.enterChordAtRow(0, TRANSPOSE_CHORDS);

        await app.transposeUpButton.click();

        // Right side: chord input reflects transposed chord
        await expect(app.chordInputAt(0)).toHaveValue(TRANSPOSE_CHORDS_UP_1);

        // Left side: textarea has updated bracket tokens
        const value = await app.lyricsTextarea.inputValue();
        expect(value).toContain('[C#]');
    });

    test('typing a bare [ in bracketed mode is accepted as lyric text', async ({ app }) => {
        await app.pasteLyricsViaButton(SINGLE_LINE_LYRICS);

        await app.lyricsTextarea.fill('love [me');

        // Bare [ is now treated as plain lyric text; value is retained verbatim.
        const value = await app.lyricsTextarea.inputValue();
        expect(value).toBe('love [me');
    });
});
