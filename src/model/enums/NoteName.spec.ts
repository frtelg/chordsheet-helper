import NoteName, { getSharpAlternative } from './NoteName';

describe('NoteName', () => {
    it.each([
        [NoteName.Aflat, 'G#'],
        [NoteName.Bflat, 'A#'],
        [NoteName.Dflat, 'C#'],
        [NoteName.Eflat, 'D#'],
        [NoteName.Gflat, 'F#'],
    ])('should get sharp alternative', (note: NoteName, expected) => {
        expect(getSharpAlternative(note)).toBe(expected);
    });
});