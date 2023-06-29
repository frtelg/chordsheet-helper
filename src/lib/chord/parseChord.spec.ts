import PowerChord from '../../model/chord/PowerChord';
import Note from "../../model/enums/NoteName";
import SuspededTriad from "../../model/chord/SuspendedTriad";
import AugmentedTriad from "../../model/chord/AugmentedTriad";
import DiminishedTriad from "../../model/chord/DiminishedTriad";
import MajorTriad from "../../model/chord/MajorTriad";
import MinorTriad from "../../model/chord/MinorTriad";
import { parseChord, parseChords } from './parseChord';

describe('parseChord', () => {
    it.each([
        ['C', new MajorTriad(Note.C)],
        ['D6', new MajorTriad(Note.D)],
        ['Db7', new MajorTriad(Note.Dflat)],
        ['C#9', new MajorTriad(Note.Dflat)],
        ['Eb11', new MajorTriad(Note.Eflat)],
        ['E13', new MajorTriad(Note.E)],
        ['Fmaj7', new MajorTriad(Note.F)],
        ['F#add9', new MajorTriad(Note.Gflat)],
        ['Gadd11', new MajorTriad(Note.G)],
        ['A♭maj7', new MajorTriad(Note.Aflat)],
        ['Amaj9', new MajorTriad(Note.A)],
        ['Bmaj13', new MajorTriad(Note.B)],
    ])('should parse %s chord as major triad %p', (chordString, expectedChord) => {
        const triad = parseChord(chordString);

        expect(triad.notes.map((mn) => mn.note)).toEqual(expectedChord.notes.map((mn) => mn.note));
    });

    it.each([
        ['Cm', new MinorTriad(Note.C)],
        ['D-6', new MinorTriad(Note.D)],
        ['Dbm7', new MinorTriad(Note.Dflat)],
        ['C#m9', new MinorTriad(Note.Dflat)],
        ['Ebm11', new MinorTriad(Note.Eflat)],
        ['E-13', new MinorTriad(Note.E)],
        ['FmMaj7', new MinorTriad(Note.F)],
        ['F#madd9', new MinorTriad(Note.Gflat)],
        ['Gmadd11', new MinorTriad(Note.G)],
        ['A♭m7', new MinorTriad(Note.Aflat)],
        ['Am9(#11)', new MinorTriad(Note.A)],
        ['Bm13', new MinorTriad(Note.B)],
    ])('should parse %s chord as minor triad %p', (chordString, expectedChord) => {
        const triad = parseChord(chordString);

        expect(triad.notes.map((mn) => mn.note)).toEqual(expectedChord.notes.map((mn) => mn.note));
    });

    it.each([
        ['Cdim', new DiminishedTriad(Note.C)],
        ['Dm7b5', new DiminishedTriad(Note.D)],
        ['Dbm7♭5', new DiminishedTriad(Note.Dflat)],
        ['C#ø', new DiminishedTriad(Note.Dflat)],
        ['Eb°', new DiminishedTriad(Note.Eflat)],
        ['Eø', new DiminishedTriad(Note.E)],
        ['Fdim', new DiminishedTriad(Note.F)],
        ['F#dim7', new DiminishedTriad(Note.Gflat)],
        ['Gdim', new DiminishedTriad(Note.G)],
        ['A♭m7b5', new DiminishedTriad(Note.Aflat)],
        ['Aø', new DiminishedTriad(Note.A)],
        ['Bb', new DiminishedTriad(Note.Bflat)],
        ['B°', new DiminishedTriad(Note.B)],
    ])('should parse %s chord as diminished triad %p', (chordString, expectedChord) => {
        const triad = parseChord(chordString);

        expect(triad.notes.map((mn) => mn.note)).toEqual(expectedChord.notes.map((mn) => mn.note));
    });

    it.each([
        ['Caugadd9', new AugmentedTriad(Note.C)],
        ['D+', new AugmentedTriad(Note.D)],
        ['Dbaug', new AugmentedTriad(Note.Dflat)],
        ['C#+', new AugmentedTriad(Note.Dflat)],
        ['Ebaug', new AugmentedTriad(Note.Eflat)],
        ['E+', new AugmentedTriad(Note.E)],
        ['Faug', new AugmentedTriad(Note.F)],
        ['F#+', new AugmentedTriad(Note.Gflat)],
        ['Gaug7', new AugmentedTriad(Note.G)],
        ['A♭+7', new AugmentedTriad(Note.Aflat)],
        ['Aaug', new AugmentedTriad(Note.A)],
        ['Bbaug7', new AugmentedTriad(Note.Bflat)],
        ['Baug13', new AugmentedTriad(Note.B)],
    ])('should parse %s chord as diminished triad %p', (chordString, expectedChord) => {
        const triad = parseChord(chordString);

        expect(triad.notes.map((mn) => mn.note)).toEqual(
            expectedChord.notes.map((mn) => mn.note)
        );
    });

    it.each([
        ['Csus2', new SuspededTriad(Note.C, 'sus2')],
        ['Dbsus4', new SuspededTriad(Note.Dflat, 'sus4')],
        ['Dsus', new SuspededTriad(Note.D, 'sus4')],
        ['Ebsus', new SuspededTriad(Note.Eflat, 'sus4')],
        ['Esus4', new SuspededTriad(Note.E, 'sus4')],
        ['Fsus2', new SuspededTriad(Note.F, 'sus2')],
        ['F#sus', new SuspededTriad(Note.Gflat, 'sus4')],
        ['Gsus4', new SuspededTriad(Note.G, 'sus4')],
        ['A♭sus2', new SuspededTriad(Note.Aflat, 'sus2')],
        ['Asus', new SuspededTriad(Note.A, 'sus4')],
        ['Bsus4', new SuspededTriad(Note.B, 'sus4')],
    ])('should parse %s chord as suspended triad %p', (chordString, expectedChord) => {
        const triad = parseChord(chordString);

        expect(triad.notes.map((mn) => mn.note)).toEqual(expectedChord.notes.map((mn) => mn.note));
    });

    it.each([
        ['C5', new PowerChord(Note.C)],
        ['Dno3', new PowerChord(Note.D)],
        ['Db5', new PowerChord(Note.Dflat)],
        ['C#no3', new PowerChord(Note.Dflat)],
        ['Eb5', new PowerChord(Note.Eflat)],
        ['Eno3', new PowerChord(Note.E)],
        ['F5', new PowerChord(Note.F)],
        ['F#no3', new PowerChord(Note.Gflat)],
        ['G5', new PowerChord(Note.G)],
        ['A♭no3', new PowerChord(Note.Aflat)],
        ['A5', new PowerChord(Note.A)],
        ['Bno3', new PowerChord(Note.B)],
    ])('should parse %s chord as major triad %p', (chordString, expectedChord) => {
        const triad = parseChord(chordString);

        expect(triad.notes.map((mn) => mn.note)).toEqual(
            expectedChord.notes.map((mn) => mn.note)
        );
    });

    it('should parse a string containing chords', () => {
        const chordsString = 'C    Em7  Dsus4     D5    F#dim  G';
        const expectedResult = [
            new MajorTriad(Note.C),
            new MinorTriad(Note.E),
            new SuspededTriad(Note.D, 'sus4'),
            new PowerChord(Note.D),
            new DiminishedTriad(Note.Gflat),
            new MajorTriad(Note.G),
        ];

        const result = parseChords(chordsString);
        const comparableResult = result.map((c) => c.notes.map((mn) => mn.note));
        const comparableExpectation = expectedResult.map((c) => c.notes.map((mn) => mn.note));

        expect(comparableResult).toEqual(comparableExpectation);
    });

    it('should ignore invalid input', () => {
        const chordsString = 'C    Em7  Dsus4  |   D5    F#dim  G';
        const expectedResult = [
            new MajorTriad(Note.C),
            new MinorTriad(Note.E),
            new SuspededTriad(Note.D, 'sus4'),
            new PowerChord(Note.D),
            new DiminishedTriad(Note.Gflat),
            new MajorTriad(Note.G),
        ];

        const result = parseChords(chordsString);
        const comparableResult = result.map((c) => c.notes.map((mn) => mn.note));
        const comparableExpectation = expectedResult.map((c) => c.notes.map((mn) => mn.note));

        expect(comparableResult).toEqual(comparableExpectation);
    });
})
