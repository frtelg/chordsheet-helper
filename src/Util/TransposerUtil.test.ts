import { transpose } from './TransposerUtil';

describe('TransposerUtil', () => {
    it('should convert chords up', () => {
        const input = 'A A# Bb B C C# Db D D# Eb E F F# Gb G G# Ab';
        const expected = 'Bb B B C C# D D Eb E E F F# G G G# A A';

        const actual = transpose(input, 1);

        expect(actual).toBe(expected);
    });

    it('should convert chords down', () => {
        const input = 'A A# Bb B C C# Db D D# Eb E F F# Gb G G# Ab';
        const expected = 'G# A A Bb B C C C# D D Eb E F F F# G G';

        const actual = transpose(input, -1);

        expect(actual).toBe(expected);
    });
});
