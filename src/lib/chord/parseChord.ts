import NoteName from '@/model/enums/NoteName';
import Chord from '@/model/chord/Chord';
import MinorTriad from '@/model/chord/MinorTriad';
import DiminishedTriad from '@/model/chord/DiminishedTriad';
import AugmentedTriad from '@/model/chord/AugmentedTriad';
import MajorTriad from '@/model/chord/MajorTriad';
import MusicNote from '@/model/note/MusicNote';
import SuspendedTriad from '@/model/chord/SuspendedTriad';
import PowerChord from '@/model/chord/PowerChord';
import InvalidNoteException from '@/model/exception/InvalidNoteException';

const rootNoteRegex = '[A-G][b#♭♯]?';
const baseTriadChordRegex = `^(?<chord>${rootNoteRegex}(5|no3|(m7(b|♭)5)|(m(?!aj)|dim|aug|-|min|\\+|ø|°|o|ø|(sus[2|4]?))?)).*$`;
const diminishedIdentifiers = ['dim', 'ø', '°', 'o', 'ø', 'm7b5', 'm7♭5'];

const isPowerChord = (baseTriad: string) => baseTriad.endsWith('5') || baseTriad.endsWith('no3');

const isAugmented = (baseTriad: string) => baseTriad.endsWith('aug') || baseTriad.endsWith('+');

const isDiminished = (baseTriad: string) =>
    !!diminishedIdentifiers.find((d) => baseTriad.endsWith(d));

const isSuspended = (baseTriad: string) => baseTriad.includes('sus');

const isMinor = (baseTriad: string) =>
    (baseTriad.endsWith('m') && !isDiminished(baseTriad)) || baseTriad.endsWith('-');

const getRootNoteFromBaseTriad = (baseTriad: string): NoteName => {
    const noteString = RegExp(`(?<note>${rootNoteRegex})`).exec(baseTriad)?.groups?.note ?? '';

    return MusicNote.parse(noteString).note;
};

export function getBaseTriad(chordString: string): string | undefined {
    const matches = RegExp(baseTriadChordRegex).exec(chordString);

    return matches?.groups?.chord;
}

// TODO: might extend this functionality with all possible chord extensions, but these base chords will
// probably be sufficient for determining key in 98% of the times, so this is a nice to have
export function parseChord(chordString: string): Chord {
    const baseTriadChordString = getBaseTriad(chordString)?.trim() ?? '';
    const rootNote = getRootNoteFromBaseTriad(chordString);

    if (isDiminished(baseTriadChordString)) return new DiminishedTriad(rootNote);
    if (isAugmented(baseTriadChordString)) return new AugmentedTriad(rootNote);
    if (isSuspended(baseTriadChordString)) return SuspendedTriad.parse(baseTriadChordString);
    if (isMinor(baseTriadChordString)) return new MinorTriad(rootNote);
    if (isPowerChord(baseTriadChordString)) return new PowerChord(rootNote);

    return new MajorTriad(rootNote);
}

export function parseChords(stringContainingChords: string): Chord[] {
    const safeParseChord = (chordString: string) => {
        try {
            return parseChord(chordString);
        } catch (error) {
            if (error instanceof InvalidNoteException) {
                return undefined;
            }

            throw error;
        }
    };

    const isDefinedChord = (chordOrUndefined?: Chord): chordOrUndefined is Chord =>
        !!chordOrUndefined;

    return stringContainingChords.split(/\s+/).map(safeParseChord).filter(isDefinedChord);
}
