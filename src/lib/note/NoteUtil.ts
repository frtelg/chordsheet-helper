import { chordRegex, majorChordRegex } from '@/model/chord/regex';
import MusicNote from '@/model/note/MusicNote';
import { getSharpAlternative } from '@/model/enums/NoteName';

export function transformFlatsToSharps(textContainingChords: string) {
    return textContainingChords.replace(new RegExp(chordRegex, 'g'), (match) => {
        return match?.replace(new RegExp(majorChordRegex, 'g'), (m) =>
            getSharpAlternative(MusicNote.parse(m).note)
        );
    });
}
