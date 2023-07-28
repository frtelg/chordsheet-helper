import NoteName from '../enums/NoteName';
import Chord from './Chord';
import MusicNote from '../note/MusicNote';

export default class MinorTriad implements Chord {
    notes: MusicNote[];

    constructor(public root: NoteName) {
        const rootNote = new MusicNote(root);
        const minorThird = rootNote.getNoteAtInterval(3);
        const perfectFifth = rootNote.getNoteAtInterval(7);

        this.notes = [rootNote, minorThird, perfectFifth];
    }
}
