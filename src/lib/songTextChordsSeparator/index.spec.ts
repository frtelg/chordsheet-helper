import parseChordsAndSongText from './index';

function run(input: string) {
    let chords: string[] = [];
    let songText = '';
    parseChordsAndSongText(
        input,
        (t) => { songText = t; },
        (c) => { chords = c; }
    );
    return { chords, lyrics: songText.split('\n') };
}

describe('parseChordsAndSongText', () => {
    describe('standard alternating chord / lyric pairs', () => {
        it('extracts chord rows and lyric rows into parallel arrays', () => {
            const { chords, lyrics } = run(
                'G           D        Em     C\nAmazing grace how sweet the sound\nG           D        G\nThat saved a wretch like me'
            );
            expect(chords).toEqual([
                'G           D        Em     C',
                'G           D        G',
            ]);
            expect(lyrics).toEqual([
                'Amazing grace how sweet the sound',
                'That saved a wretch like me',
            ]);
        });

        it('preserves chord column spacing', () => {
            const { chords } = run('G           D        Em     C\nAmazing grace');
            expect(chords[0]).toBe('G           D        Em     C');
        });
    });

    describe('instrumental chord rows', () => {
        it('instrumental row (followed by another chord) gets an empty lyric', () => {
            const { chords, lyrics } = run(
                '| G | D | Em | C |\nG D Em C\nAmazing grace'
            );
            expect(chords[0]).toBe('| G | D | Em | C |');
            expect(lyrics[0]).toBe('');
            expect(chords[1]).toBe('G D Em C');
            expect(lyrics[1]).toBe('Amazing grace');
        });

        it('consecutive instrumental rows each get an empty lyric', () => {
            const { chords, lyrics } = run(
                '| G | D | Em | C |\n| G | D | Em | C |\nG D Em C\nAmazing grace'
            );
            expect(chords).toHaveLength(3);
            expect(lyrics[0]).toBe('');
            expect(lyrics[1]).toBe('');
            expect(lyrics[2]).toBe('Amazing grace');
        });

        it('instrumental row at end of input gets an empty lyric', () => {
            const { chords, lyrics } = run('| G | D | Em | C |');
            expect(chords).toEqual(['| G | D | Em | C |']);
            expect(lyrics).toEqual(['']);
        });

        it('no synthetic blank inserted between adjacent chord rows followed by lyric', () => {
            const { chords, lyrics } = run('G D\nAm F\nAmazing grace');
            // G D is instrumental (next is chord), Am F pairs with Amazing grace
            expect(chords).toEqual(['G D', 'Am F']);
            expect(lyrics[0]).toBe('');
            expect(lyrics[1]).toBe('Amazing grace');
        });
    });

    describe('blank lines in input', () => {
        it('blank line between chord and next chord section is preserved', () => {
            const { chords, lyrics } = run('G D\n\nAm F\nAmazing grace');
            // G D pairs with the blank (next non-chord line)
            expect(chords[0]).toBe('G D');
            expect(lyrics[0]).toBe('');
        });

        it('blank line between lyric sections is preserved as an empty row', () => {
            const { lyrics } = run('G D\nAmazing grace\n\nAm F\nThat saved a wretch');
            expect(lyrics).toContain('');
        });
    });

    describe('pure lyric input', () => {
        it('lyric-only input produces empty chord array entries', () => {
            const { chords, lyrics } = run('Amazing grace\nThat saved a wretch');
            expect(chords).toEqual(['', '']);
            expect(lyrics).toEqual(['Amazing grace', 'That saved a wretch']);
        });
    });
});
