import Note from '../../model/enums/NoteName';
import MajorTriad from '../../model/chord/MajorTriad';
import MinorTriad from '../../model/chord/MinorTriad';
import findKey from './findKey';
import DiminishedTriad from '../../model/chord/DiminishedTriad';

describe('findKey', () => {
    it('should discover the C major key', () => {
        const chords = [
            new MajorTriad(Note.C),
            new MinorTriad(Note.D),
            new MinorTriad(Note.E),
            new MajorTriad(Note.F),
            new MajorTriad(Note.G),
            new MinorTriad(Note.A),
            new DiminishedTriad(Note.B),
        ];

        expect(findKey(chords)).toBe(Note.C);
    });

    it('should discover the G major key', () => {
        const chords = [
            new MajorTriad(Note.G),
            new MinorTriad(Note.A),
            new MinorTriad(Note.B),
            new MajorTriad(Note.C),
            new MajorTriad(Note.D),
            new MinorTriad(Note.E),
            new DiminishedTriad(Note.Gflat),
        ];

        expect(findKey(chords)).toBe(Note.G);
    });

    it('should discover the Eflat major key', () => {
        const chords = [
            new MajorTriad(Note.Eflat),
            new MinorTriad(Note.F),
            new MinorTriad(Note.G),
            new MajorTriad(Note.Aflat),
            new MajorTriad(Note.Bflat),
            new MinorTriad(Note.C),
            new DiminishedTriad(Note.D),
        ];

        expect(findKey(chords)).toBe(Note.Eflat);
    });
});
