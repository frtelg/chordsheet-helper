import { FLAT, FLAT_SYMBOL, SHARP, SHARP_SYMBOL } from '../../constants/musicconstants';
import NoteName, { getNoteByKey } from '../enums/NoteName';

const mod = (target: number, m: number) => ((target % m) + m) % m;

export default class MusicNote {
    static parse(noteString: string): MusicNote {
        const isSharp = noteString.endsWith(SHARP) || noteString.endsWith(SHARP_SYMBOL);

        if (isSharp) {
            const naturalNote = MusicNote.parse(noteString.charAt(0));
            return naturalNote.getNoteAtInterval(1);
        }

        const note = getNoteByKey(noteString.replace(FLAT_SYMBOL, FLAT));

        return new MusicNote(note);
    }

    constructor(public note: NoteName) {}

    equals = (other: MusicNote): boolean => this.note === other.note;

    getNoteAtInterval = (halfSteps: number): MusicNote => {
        const notes = Object.values(NoteName);
        const index = notes.findIndex((v) => v === this.note);
        const newIndex = mod(index + halfSteps, notes.length);

        return new MusicNote(notes[newIndex]);
    };
}
