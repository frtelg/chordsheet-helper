import InvalidNoteException from '../exception/InvalidNoteException';
import { mod } from '@/lib/math';

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

export const getNoteAtInterval = (note: NoteName, halfSteps: number): NoteName => {
    const notes = Object.values(NoteName);
    const index = notes.findIndex((v) => v === note);
    const newIndex = mod(index + halfSteps, notes.length);

    return notes[newIndex];
};

export const getSharpAlternative = (flatNote: NoteName): string => {
    const isFlat = flatNote.length > 1 && flatNote.charAt(1) === 'b';

    if (!isFlat) return flatNote;

    return getNoteByKey(getNoteAtInterval(flatNote, 11)) + '#';
};

export const isFlat = (note: NoteName) => note.length > 1;

export const shouldKeyUseSharps = (key: NoteName): boolean => {
    const keysThatUseSharps = [NoteName.G, NoteName.D, NoteName.A, NoteName.E, NoteName.B, NoteName.Gflat, NoteName.Dflat];
    
    return keysThatUseSharps.includes(key);
}

export default NoteName;
