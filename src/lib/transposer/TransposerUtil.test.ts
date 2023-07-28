import { transpose } from './TransposerUtil';

describe('TransposerUtil', () => {
    it('should convert chords up', () => {
        const input = 'A A# Bb B C C# Db D D# Eb E F F# Gb G G# Ab';
        const expected = 'Bb B B C Db D D Eb E E F Gb G G Ab A A';

        const actual = transpose(input, 1);

        expect(actual).toBe(expected);
    });

    it('should convert chords down', () => {
        const input = 'A A# Bb B C C# Db D D# Eb E F F# Gb G G# Ab';
        const expected = 'Ab A A Bb B C C Db D D Eb E F F Gb G G';

        const actual = transpose(input, -1);

        expect(actual).toBe(expected);
    });
});
