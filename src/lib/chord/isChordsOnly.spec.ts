import isChordsOnly from './isChordsOnly';

describe('isChordsOnly', () => {
    describe('plain chord lines (existing)', () => {
        it('returns true for a string containing only chords', () => {
            expect(isChordsOnly('G D Em C')).toBeTruthy();
        });

        it('returns true for a string containing only chords with whitespace', () => {
            expect(isChordsOnly('  G   D   Em   C  ')).toBeTruthy();
        });

        it('returns true for Fsus4 F Bb2/D', () => {
            expect(isChordsOnly('       Fsus4      F       Bb2/D')).toBeTruthy();
        });

        it('returns false for a string containing lyrics', () => {
            expect(isChordsOnly('Verse 1: G D Em C')).toBeFalsy();
        });

        it('returns false for a string containing mixed chords and lyrics', () => {
            expect(isChordsOnly('Verse 1: G D Em C\nVerse 2: G D C G')).toBeFalsy();
        });
    });

    describe('comma and period punctuation', () => {
        it('returns true for a chord line with comma/period punctuation', () => {
            expect(isChordsOnly('G, D, Em, C.')).toBeTruthy();
        });

        it('returns false for a lyric line with comma/period punctuation', () => {
            expect(isChordsOnly('Hello, world.')).toBeFalsy();
        });
    });

    describe('instrumental punctuation — accepts', () => {
        it('returns true for bar-separated chord line', () => {
            expect(isChordsOnly('| G | D | Em | C |')).toBeTruthy();
        });

        it('returns true for repeat-bar notation', () => {
            expect(isChordsOnly('|: G D Em C :|')).toBeTruthy();
        });

        it('returns true for rhythm slashes inside bars', () => {
            expect(isChordsOnly('| G / / / | D / / / |')).toBeTruthy();
        });

        it('returns true for bracketed chord line', () => {
            expect(isChordsOnly('[G] [D] [Em] [C]')).toBeTruthy();
        });

        it('returns true for optional chord notation', () => {
            expect(isChordsOnly('(Am) G D')).toBeTruthy();
        });
    });

    describe('lyric lines with instrumental-looking characters — rejects', () => {
        it('returns false for section header [Intro]', () => {
            expect(isChordsOnly('[Intro]')).toBeFalsy();
        });

        it('returns false for section header mixed with chords', () => {
            expect(isChordsOnly('[Chorus] G D')).toBeFalsy();
        });

        it('returns false for lyric line with colon and chords', () => {
            expect(isChordsOnly('Verse 1: G D Em C')).toBeFalsy();
        });
    });

    describe('boundary cases', () => {
        it('returns false for empty string', () => {
            expect(isChordsOnly('')).toBeFalsy();
        });

        it('returns false for whitespace-only string', () => {
            expect(isChordsOnly('   ')).toBeFalsy();
        });

        it('returns false for punctuation-only line', () => {
            expect(isChordsOnly('| | |')).toBeFalsy();
        });

        it('returns true for a single chord', () => {
            expect(isChordsOnly('G')).toBeTruthy();
        });

        it('returns false for a single instrumental token without chords', () => {
            expect(isChordsOnly('|:')).toBeFalsy();
        });
    });
});
