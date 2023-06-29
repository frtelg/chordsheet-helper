import Note from '../enums/NoteName';
import MinorTriad from './MinorTriad';

it.each([
    [Note.C,     [Note.C,     Note.Eflat, Note.G]],
    [Note.Dflat, [Note.Dflat, Note.E,     Note.Aflat]],
    [Note.D,     [Note.D,     Note.F,     Note.A]],
    [Note.Eflat, [Note.Eflat, Note.Gflat, Note.Bflat]],
    [Note.E,     [Note.E,     Note.G,     Note.B]],
    [Note.F,     [Note.F,     Note.Aflat, Note.C]],
    [Note.Gflat, [Note.Gflat, Note.A,     Note.Dflat]],
    [Note.G,     [Note.G,     Note.Bflat, Note.D]],
    [Note.Aflat, [Note.Aflat, Note.B,     Note.Eflat]],
    [Note.A,     [Note.A,     Note.C,     Note.E]],
    [Note.Bflat, [Note.Bflat, Note.Dflat, Note.F]],
    [Note.B,     [Note.B,     Note.D,     Note.Gflat]],
])(
    'should define %p Minor triad as notes %p',
    (root, triadNotes) => {
        const triad = new MinorTriad(root);

        expect(triad.notes.map(n => n.note)).toEqual(triadNotes);
    }
);
