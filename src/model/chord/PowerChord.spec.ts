import Note from '../enums/NoteName';
import PowerChord from './PowerChord';

it.each([
    [Note.C,     [Note.C,     Note.G]],
    [Note.Dflat, [Note.Dflat, Note.Aflat]],
    [Note.D,     [Note.D,     Note.A]],
    [Note.Eflat, [Note.Eflat, Note.Bflat]],
    [Note.E,     [Note.E,     Note.B]],
    [Note.F,     [Note.F,     Note.C]],
    [Note.Gflat, [Note.Gflat, Note.Dflat]],
    [Note.G,     [Note.G,     Note.D]],
    [Note.Aflat, [Note.Aflat, Note.Eflat]],
    [Note.A,     [Note.A,     Note.E]],
    [Note.Bflat, [Note.Bflat, Note.F]],
    [Note.B,     [Note.B,     Note.Gflat]],
])(
    'should define %p power chord as notes %p',
    (root, triadNotes) => {
        const triad = new PowerChord(root);

        expect(triad.notes.map(n => n.note)).toEqual(triadNotes);
    }
);
