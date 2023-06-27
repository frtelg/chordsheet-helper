enum Note {
    C = 'C',
    Csharp = 'C#',
    D = 'D',
    Dsharp = 'Eb',
    E = 'E',
    F = 'F',
    Fsharp = 'F#',
    G = 'G',
    Gsharp = 'G#',
    A = 'A',
    Asharp = 'Bb',
    B = 'B',
}

export const noteOf = (key: string): Note => Object.values(Note).find((v) => v === key) || Note.C;

export default Note;
