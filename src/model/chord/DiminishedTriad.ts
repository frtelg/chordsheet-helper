import NoteName from '../enums/NoteName';
import Chord from './Chord';
import MusicNote from '../note/MusicNote';

export default class DiminishedTriad implements Chord {
    notes: MusicNote[];

    constructor(public root: NoteName) {
        const rootNote = new MusicNote(root);
        const minorThird = rootNote.getNoteAtInterval(3);
        const diminishedFifth = rootNote.getNoteAtInterval(6);

        this.notes = [rootNote, minorThird, diminishedFifth];
    }
}
