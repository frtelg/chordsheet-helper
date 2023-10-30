export const majorChordRegex = '[A-G][b#♭♯]?';
export const chordRegex = `(${majorChordRegex}(maj|m|dim|aug|-|\\+)?([1-9][0-9]?)?(sus|add)?([1-9][0-9]?)?(/${majorChordRegex})?)`;
