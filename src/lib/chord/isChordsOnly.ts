import { chordRegex } from '@/model/chord/regex';

const allowedCharRegex = /^[\sA-Za-z0-9#♭♯|\[\]:/().,]+$/;
const wordRegex = /[A-Za-z]+/g;

const isChordsOnly = (s: string): boolean => {
    if (!s.trim()) return false;
    if (!allowedCharRegex.test(s)) return false;
    const words = s.match(wordRegex) ?? [];
    if (words.length === 0) return false;
    const chordTest = new RegExp(`^${chordRegex}$`);
    return words.every((w) => chordTest.test(w));
};

export default isChordsOnly;
