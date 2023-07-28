import InvalidNoteException from '../exception/InvalidNoteException';

enum NoteName {
    C = 'C',
    Dflat = 'Db',
    D = 'D',
    Eflat = 'Eb',
    E = 'E',
    F = 'F',
    Gflat = 'Gb',
    G = 'G',
    Aflat = 'Ab',
    A = 'A',
    Bflat = 'Bb',
    B = 'B',
}

export const getNoteByKey = (key: string): NoteName => {
    const result = Object.values(NoteName).find((v) => v === key);

    if (!result) throw new InvalidNoteException(key);

    return result;
};

export const getSharpAlternative = (flatNote: NoteName): string => {
    const isFlat = flatNote.length > 1;

    if (!isFlat) return flatNote;

    return getNoteByKey(flatNote.charAt(0)) + '#';
};

export const isFlat = (note: NoteName) => note.length > 1;

export default NoteName;
