import { chordRegex, majorChordRegex } from '@/model/chord/regex';
import MusicNote from '@/model/note/MusicNote';

export const transpose = (textContainingChords: string, transposeSteps: number) => {
    return textContainingChords.replace(new RegExp(chordRegex, 'g'), (match) => {
        return match?.replace(
            new RegExp(majorChordRegex, 'g'),
            (m) => MusicNote.parse(m).getNoteAtInterval(transposeSteps).note
        );
    });
};
