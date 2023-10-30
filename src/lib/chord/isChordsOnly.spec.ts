import isChordsOnly from './isChordsOnly';

describe('isChordsOnly', () => {
    it('should return true for a string containing only chords', () => {
        const input = 'G D Em C';
        const result = isChordsOnly(input);
        expect(result).toBeTruthy();
    });

    it('should return true for a string containing only chords with whitespace', () => {
        const input = '  G   D   Em   C  ';
        const result = isChordsOnly(input);
        expect(result).toBeTruthy();
    });

    it('should return false for a string containing only chords with punctuation', () => {
        const input = 'G, D, Em, C.';
        const result = isChordsOnly(input);
        expect(result).toBeFalsy();
    });

    it('should return false for a string containing lyrics', () => {
        const input = 'Verse 1: G D Em C';
        const result = isChordsOnly(input);
        expect(result).toBeFalsy();
    });

    it('should return false for a string containing mixed chords and lyrics', () => {
        const input = 'Verse 1: G D Em C\nVerse 2: G D C G';
        const result = isChordsOnly(input);
        expect(result).toBeFalsy();
    });

    it('should return true for Fsus4 F Bb2/D', () => {
        const input = '       Fsus4      F       Bb2/D';
        const result = isChordsOnly(input);
        expect(result).toBeTruthy();
    });
});
