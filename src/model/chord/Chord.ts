import NoteName from '../enums/NoteName';
import MusicNote from '../note/MusicNote';

export default interface Chord {
    root: NoteName;
    notes: MusicNote[];
}
