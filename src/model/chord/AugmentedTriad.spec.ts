import NoteName from '../enums/NoteName';
import AugmentedTriad from './AugmentedTriad';

it.each([
    [NoteName.C,     [NoteName.C,     NoteName.E,     NoteName.Aflat]],
    [NoteName.Dflat, [NoteName.Dflat, NoteName.F,     NoteName.A]],
    [NoteName.D,     [NoteName.D,     NoteName.Gflat, NoteName.Bflat]],
    [NoteName.Eflat, [NoteName.Eflat, NoteName.G,     NoteName.B]],
    [NoteName.E,     [NoteName.E,     NoteName.Aflat, NoteName.C]],
    [NoteName.F,     [NoteName.F,     NoteName.A,     NoteName.Dflat]],
    [NoteName.Gflat, [NoteName.Gflat, NoteName.Bflat, NoteName.D]],
    [NoteName.G,     [NoteName.G,     NoteName.B,     NoteName.Eflat]],
    [NoteName.Aflat, [NoteName.Aflat, NoteName.C,     NoteName.E]],
    [NoteName.A,     [NoteName.A,     NoteName.Dflat, NoteName.F]],
    [NoteName.Bflat, [NoteName.Bflat, NoteName.D,     NoteName.Gflat]],
    [NoteName.B,     [NoteName.B,     NoteName.Eflat, NoteName.G]],
])(
    'should define %p Augmented triad as notes %p',
    (root, triadNotes) => {
        const triad = new AugmentedTriad(root);

        expect(triad.notes.map(n => n.note)).toEqual(triadNotes);
    }
);
