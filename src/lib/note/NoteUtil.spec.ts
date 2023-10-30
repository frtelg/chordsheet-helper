import { transformFlatsToSharps } from './NoteUtil';

describe('transformFlatsToSharps', () => {
    it('should transform flats to sharps', () => {
        const input = 'C Am F Bb G7';
        const expectedOutput = 'C Am F A# G7';

        const output = transformFlatsToSharps(input);

        expect(output).toEqual(expectedOutput);
    });

    it('should not transform sharps', () => {
        const input = 'C Am F A# G7';
        const expectedOutput = 'C Am F A# G7';

        const output = transformFlatsToSharps(input);

        expect(output).toEqual(expectedOutput);
    });

    it('should not transform non-chord text', () => {
        const input = 'This is some text';
        const expectedOutput = 'This is some text';

        const output = transformFlatsToSharps(input);

        expect(output).toEqual(expectedOutput);
    });
});
