import { chordRegex } from '@/model/chord/regex';

const allowedCharRegex = /^[\sA-Za-z0-9#♭♯|\[\]:/().,]+$/;
const BAR_TOKENS = new Set(['|', '||', '|:', ':|', '||:', ':||', '/']);
const PAREN_QUALIFIER_REGEX = /\((?:[b#♭♯]+|add)?[0-9]+\)/g;
const TRAILING_PUNCT_REGEX = /[.,]+$/;
const chordTest = new RegExp(`^${chordRegex}$`);

const isChordsOnly = (s: string): boolean => {
    if (!s.trim()) return false;
    if (!allowedCharRegex.test(s)) return false;
    // Unwrap bracket notation ([G] → G, ([Am]) → (Am)) so each whitespace-delimited
    // token reflects the underlying chord shape (e.g. "F#m7" stays a single token
    // instead of splitting into "F" and "m" on letter-only extraction).
    const unbracketed = s.replace(/\(\[([^\]]+)\]\)/g, '($1)').replace(/\[([^\]]+)\]/g, '$1');
    const tokens = unbracketed.split(/\s+/).filter(Boolean);
    let chordCount = 0;
    for (const raw of tokens) {
        if (BAR_TOKENS.has(raw)) continue;
        let token = raw.replace(TRAILING_PUNCT_REGEX, '');
        if (token.startsWith('(') && token.endsWith(')')) {
            token = token.slice(1, -1);
        }
        token = token.replace(PAREN_QUALIFIER_REGEX, '');
        if (!token) return false;
        if (!chordTest.test(token)) return false;
        chordCount++;
    }
    return chordCount > 0;
};

export default isChordsOnly;
