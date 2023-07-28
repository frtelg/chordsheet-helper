import NoteName from '../enums/NoteName';
import Chord from './Chord';
import MusicNote from '../note/MusicNote';

export default class MajorTriad implements Chord {
    notes: MusicNote[];

    constructor(public root: NoteName) {
        const rootNote = new MusicNote(root);
        const majorThird = rootNote.getNoteAtInterval(4);
        const perfectFifth = rootNote.getNoteAtInterval(7);

        this.notes = [rootNote, majorThird, perfectFifth];
    }
}
