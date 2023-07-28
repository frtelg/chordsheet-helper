import NoteName from '../../model/enums/NoteName';
import MusicNote from '../../model/note/MusicNote';
import Chord from '../../model/chord/Chord';

interface Scale {
    root: NoteName;
    scale: MusicNote[];
}

interface MajorScaleNotesMatchResult {
    root: NoteName;
    numberOfMatches: number;
}

const notes: MusicNote[] = Object.values(NoteName).map((n) => new MusicNote(n));

export const majorScales: Scale[] = notes.map((n) => {
    const root = n;
    const majorSecond = n.getNoteAtInterval(2);
    const majorThird = n.getNoteAtInterval(4);
    const perfectFourth = n.getNoteAtInterval(5);
    const perfectFifth = n.getNoteAtInterval(7);
    const majorSixth = n.getNoteAtInterval(9);
    const majorSeventh = n.getNoteAtInterval(11);

    return {
        root: root.note,
        scale: [
            root,
            majorSecond,
            majorThird,
            perfectFourth,
            perfectFifth,
            majorSixth,
            majorSeventh,
        ],
    };
});

const scaleMatchResultSorter = (
    l: MajorScaleNotesMatchResult,
    r: MajorScaleNotesMatchResult,
    chords: Chord[]
) => {
    if (l.numberOfMatches < r.numberOfMatches) return 1;
    if (l.numberOfMatches > r.numberOfMatches) return -1;

    const finalChord = chords[chords.length - 1];

    if (l.root === finalChord.root) return -1;
    if (r.root === finalChord.root) return 1;

    const firstChord = chords[0];

    if (l.root === firstChord.root) return -1;
    if (r.root === firstChord.root) return 1;

    return 0;
};

export default function findKey(chords: Chord[]) {
    if (chords.length === 0) return undefined;

    const matchResult: MajorScaleNotesMatchResult[] = majorScales.map((scale) => ({
        root: scale.root,
        numberOfMatches: chords
            .map(
                (c) =>
                    c.notes.filter(
                        (note: MusicNote) =>
                            !!scale.scale.find((scaleNote) => scaleNote.equals(note))
                    ).length
            )
            .reduce((acc, elem) => acc + elem),
    }));

    const sortedResult = [...matchResult].sort((l, r) => scaleMatchResultSorter(l, r, chords));

    return sortedResult[0].root;
}
