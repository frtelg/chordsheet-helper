import Note from '../enums/NoteName';
import SuspendedTriad from './SuspendedTriad';

describe('SuspendedTriads', () => {

    const sus2Chords = [
        [Note.C, [Note.C, Note.D, Note.G]],
        [Note.Dflat, [Note.Dflat, Note.Eflat, Note.Aflat]],
        [Note.D, [Note.D, Note.E, Note.A]],
        [Note.Eflat, [Note.Eflat, Note.F, Note.Bflat]],
        [Note.E, [Note.E, Note.Gflat, Note.B]],
        [Note.F, [Note.F, Note.G, Note.C]],
        [Note.Gflat, [Note.Gflat, Note.Aflat, Note.Dflat]],
        [Note.G, [Note.G, Note.A, Note.D]],
        [Note.Aflat, [Note.Aflat, Note.Bflat, Note.Eflat]],
        [Note.A, [Note.A, Note.B, Note.E]],
        [Note.Bflat, [Note.Bflat, Note.C, Note.F]],
        [Note.B, [Note.B, Note.Dflat, Note.Gflat]],
    ];

    it.each(sus2Chords)('should define %p Major triad as notes %p when using sus2', (root, triadNotes) => {
        const triad = new SuspendedTriad(root, 'sus2');

        expect(triad.notes.map((n) => n.note)).toEqual(triadNotes);
    });

    it.each(sus2Chords)(
        'should define %p Major triad as notes %p when parsing sus2',
        (root, triadNotes) => {
            const triad = SuspendedTriad.parse(root + 'sus2');

            expect(triad.notes.map((n) => n.note)).toEqual(triadNotes);
        }
    );

    const sus4Chords = [
        [Note.C, [Note.C, Note.F, Note.G]],
        [Note.Dflat, [Note.Dflat, Note.Gflat, Note.Aflat]],
        [Note.D, [Note.D, Note.G, Note.A]],
        [Note.Eflat, [Note.Eflat, Note.Aflat, Note.Bflat]],
        [Note.E, [Note.E, Note.A, Note.B]],
        [Note.F, [Note.F, Note.Bflat, Note.C]],
        [Note.Gflat, [Note.Gflat, Note.B, Note.Dflat]],
        [Note.G, [Note.G, Note.C, Note.D]],
        [Note.Aflat, [Note.Aflat, Note.Dflat, Note.Eflat]],
        [Note.A, [Note.A, Note.D, Note.E]],
        [Note.Bflat, [Note.Bflat, Note.Eflat, Note.F]],
        [Note.B, [Note.B, Note.E, Note.Gflat]],
    ];

    it.each(sus4Chords)(
        'should define %p Major triad as notes %p when using sus',
        (root, triadNotes) => {
            const triad = new SuspendedTriad(root, 'sus');

            expect(triad.notes.map((n) => n.note)).toEqual(triadNotes);
        }
    );

    it.each(sus4Chords)(
        'should define %p Major triad as notes %p when parsing sus',
        (root, triadNotes) => {
            const triad = SuspendedTriad.parse(root + 'sus');

            expect(triad.notes.map((n) => n.note)).toEqual(triadNotes);
        }
    );

    it.each(sus4Chords)(
        'should define %p Major triad as notes %p when using sus4',
        (root, triadNotes) => {
            const triad = new SuspendedTriad(root, 'sus4');

            expect(triad.notes.map((n) => n.note)).toEqual(triadNotes);
        }
    );

    it.each(sus4Chords)(
        'should define %p Major triad as notes %p when parsing sus4',
        (root, triadNotes) => {
            const triad = SuspendedTriad.parse(root + 'sus4');

            expect(triad.notes.map((n) => n.note)).toEqual(triadNotes);
        }
    );
});
