import Note from '../enums/NoteName';
import DiminishedTriad from './DiminishedTriad';

it.each([
    [Note.C,     [Note.C,     Note.Eflat, Note.Gflat]],
    [Note.Dflat, [Note.Dflat, Note.E,     Note.G]],
    [Note.D,     [Note.D,     Note.F,     Note.Aflat]],
    [Note.Eflat, [Note.Eflat, Note.Gflat, Note.A]],
    [Note.E,     [Note.E,     Note.G,     Note.Bflat]],
    [Note.F,     [Note.F,     Note.Aflat, Note.B]],
    [Note.Gflat, [Note.Gflat, Note.A,     Note.C]],
    [Note.G,     [Note.G,     Note.Bflat, Note.Dflat]],
    [Note.Aflat, [Note.Aflat, Note.B,     Note.D]],
    [Note.A,     [Note.A,     Note.C,     Note.Eflat]],
    [Note.Bflat, [Note.Bflat, Note.Dflat, Note.E]],
    [Note.B,     [Note.B,     Note.D,     Note.F]],
])(
    'should define %p Diminished triad as notes %p',
    (root, triadNotes) => {
        const triad = new DiminishedTriad(root);

        expect(triad.notes.map(n => n.note)).toEqual(triadNotes);
    }
);
