import NoteName from '@/model/enums/NoteName';
import Chord from './Chord';
import MusicNote from '@/model/note/MusicNote';
import { majorChordRegex } from './regex';

export type Suspension = 'sus' | 'sus2' | 'sus4';

function getSuspensionNote(root: MusicNote, suspension: Suspension) {
    return suspension === 'sus2' ? root.getNoteAtInterval(2) : root.getNoteAtInterval(5);
}

function isSuspension(suspensionString?: string): suspensionString is Suspension {
    return /^sus[24]?$/.test(suspensionString ?? '');
}

export default class SuspededTriad implements Chord {
    notes: MusicNote[];

    static parse(chord: string): SuspededTriad {
        const matches = RegExp(`^(?<rootNote>${majorChordRegex})(?<suspension>sus[24]?)`).exec(
            chord
        )?.groups;

        if (!matches?.rootNote || !isSuspension(matches?.suspension))
            throw new Error(`Cannot parse '${chord}' as suspended chord`);

        const root = MusicNote.parse(matches.rootNote);

        return new SuspededTriad(root.note, matches.suspension);
    }

    constructor(public root: NoteName, suspensionNote: Suspension) {
        const rootNote = new MusicNote(root);
        const suspendedNote = getSuspensionNote(rootNote, suspensionNote);
        const perfectFifth = rootNote.getNoteAtInterval(7);

        this.notes = [rootNote, suspendedNote, perfectFifth];
    }
}
