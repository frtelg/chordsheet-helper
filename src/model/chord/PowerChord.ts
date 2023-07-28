import Chord from '@/model/chord/Chord';
import MusicNote from '../note/MusicNote';
import NoteName from '../enums/NoteName';

export default class PowerChord implements Chord {
    notes: MusicNote[];

    constructor(public root: NoteName) {
        const rootNote = new MusicNote(root);
        const fifth = rootNote.getNoteAtInterval(7);

        this.notes = [rootNote, fifth];
    }
}
