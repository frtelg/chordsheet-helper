import NoteName from '@/redux/Reducer/node_modules/@/model/enums/NoteName';
import Chord from './Chord';
import MusicNote from '../note/MusicNote';

export default class AugmentedTriad implements Chord {
    notes: MusicNote[];

    constructor(public root: NoteName) {
        const rootNote = new MusicNote(root);
        const majorThird = rootNote.getNoteAtInterval(4);
        const sharpFifth = rootNote.getNoteAtInterval(8);

        this.notes = [rootNote, majorThird, sharpFifth];
    }
}
