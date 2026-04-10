import { formatChordSheet } from './formatChordSheet';

describe('formatChordSheet', () => {
    describe('chords-over-lyrics', () => {
        it('row with chords emits chord line then lyric line', () => {
            const result = formatChordSheet('chords-over-lyrics', ['G       D'], ['Amazing grace']);
            expect(result).toBe('G       D\nAmazing grace');
        });

        it('row without chords emits lyric line only', () => {
            const result = formatChordSheet('chords-over-lyrics', [''], ['Amazing grace']);
            expect(result).toBe('Amazing grace');
        });

        it('mixed rows', () => {
            const chords = ['G   D', '', 'Em  C'];
            const lyrics = ['Amazing grace', 'how sweet', 'the sound'];
            const result = formatChordSheet('chords-over-lyrics', chords, lyrics);
            expect(result).toBe('G   D\nAmazing grace\nhow sweet\nEm  C\nthe sound');
        });
    });

    describe('bracketed', () => {
        it('row with chords emits bracketed inline line', () => {
            const result = formatChordSheet('bracketed', ['G'], ['Amazing grace']);
            expect(result).toBe('[G]Amazing grace');
        });

        it('row without chords emits plain lyric line', () => {
            const result = formatChordSheet('bracketed', [''], ['Amazing grace']);
            expect(result).toBe('Amazing grace');
        });

        it('instrumental row emits bracketed chord tokens', () => {
            const result = formatChordSheet('bracketed', ['G   D'], ['']);
            expect(result).toBe('[G][D]');
        });
    });

    describe('consecutive instrumental rows', () => {
        it('no blank line between consecutive instrumental rows — chords-over-lyrics', () => {
            const chords = ['Am  G', 'Em  C', 'G'];
            const lyrics = ['', '', 'Amazing grace'];
            const result = formatChordSheet('chords-over-lyrics', chords, lyrics);
            // First row is instrumental at start of song — no blank before it
            // Consecutive instrumentals: no blank between them; blank after before lyric section
            expect(result).toBe('Am  G\nEm  C\n\nG\nAmazing grace');
        });

        it('no blank line between consecutive instrumental rows — bracketed', () => {
            const chords = ['Am  G', 'Em  C', 'G'];
            const lyrics = ['', '', 'Amazing grace'];
            const result = formatChordSheet('bracketed', chords, lyrics);
            expect(result).toBe('[Am][G]\n[Em][C]\n\n[G]Amazing grace');
        });

        it('single instrumental row between lyric sections — blank lines on both sides — bracketed', () => {
            const chords = ['G', '', 'Am  D', '', 'Em'];
            const lyrics = ['Amazing grace', 'how sweet the sound', '', 'that saved a wretch', 'like me'];
            const result = formatChordSheet('bracketed', chords, lyrics);
            expect(result).toBe(
                '[G]Amazing grace\nhow sweet the sound\n\n[Am][D]\n\nthat saved a wretch\n[Em]like me',
            );
        });

        it('single instrumental row between lyric sections — blank lines on both sides — chords-over-lyrics', () => {
            const chords = ['G', 'Am  D', ''];
            const lyrics = ['Amazing grace', '', 'That saved a wretch'];
            const result = formatChordSheet('chords-over-lyrics', chords, lyrics);
            expect(result).toBe('G\nAmazing grace\n\nAm  D\n\nThat saved a wretch');
        });

        it('trailing instrumental rows do not produce trailing blank lines', () => {
            const result = formatChordSheet('bracketed', ['Am  G'], ['']);
            expect(result).toBe('[Am][G]');
        });
    });
});
