import { chordRegex, majorChordRegex } from '@/model/chord/regex';
import MusicNote from '@/model/note/MusicNote';

const chordLineRegex = `^((\\W+)?(${chordRegex})(\\W+)?)+$`;

export const isChordsOnly = (s: string) => s.match(new RegExp(chordLineRegex, 'g'));

export const transpose = (textContainingChords: string, transposeSteps: number) => {
    return textContainingChords.replace(new RegExp(chordRegex, 'g'), (match) => {
        return match?.replace(
            new RegExp(majorChordRegex, 'g'),
            (m) => MusicNote.parse(m).getNoteAtInterval(transposeSteps).note
        );
    });
};
