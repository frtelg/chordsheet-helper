import { chordRegex } from '@/model/chord/regex';

const allowedCharRegex = /^[\sA-Za-z0-9#♭♯|\[\]:/().,]+$/;
const wordRegex = /[A-Za-z]+/g;

const isChordsOnly = (s: string): boolean => {
    if (!s.trim()) return false;
    if (!allowedCharRegex.test(s)) return false;
    // Strip parenthetical interval qualifiers like (b5), (#9), (add11) before word extraction
    // so their constituent letters don't fail the per-word chord root test.
    const normalized = s.replace(/\((?:[b#♭♯]+|add)?[0-9]+\)/g, '');
    const words = normalized.match(wordRegex) ?? [];
    if (words.length === 0) return false;
    const chordTest = new RegExp(`^${chordRegex}$`);
    return words.every((w) => chordTest.test(w));
};

export default isChordsOnly;
