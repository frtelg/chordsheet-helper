import Note from '../enums/NoteName';
import MajorTriad from './MajorTriad';

it.each([
    [Note.C,     [Note.C,     Note.E,     Note.G]],
    [Note.Dflat, [Note.Dflat, Note.F,     Note.Aflat]],
    [Note.D,     [Note.D,     Note.Gflat, Note.A]],
    [Note.Eflat, [Note.Eflat, Note.G,     Note.Bflat]],
    [Note.E,     [Note.E,     Note.Aflat, Note.B]],
    [Note.F,     [Note.F,     Note.A,     Note.C]],
    [Note.Gflat, [Note.Gflat, Note.Bflat, Note.Dflat]],
    [Note.G,     [Note.G,     Note.B,     Note.D]],
    [Note.Aflat, [Note.Aflat, Note.C,     Note.Eflat]],
    [Note.A,     [Note.A,     Note.Dflat, Note.E]],
    [Note.Bflat, [Note.Bflat, Note.D,     Note.F]],
    [Note.B,     [Note.B,     Note.Eflat, Note.Gflat]],
])(
    'should define %p Major triad as notes %p',
    (root, triadNotes) => {
        const triad = new MajorTriad(root);

        expect(triad.notes.map(n => n.note)).toEqual(triadNotes);
    }
);
