const BAR_SEPARATORS = new Set(['|', '||', '||:', ':||']);

type Token = {
    offset: number;
    formatted: string; // what to insert into the lyric
};

function isBarSeparator(text: string): boolean {
    return BAR_SEPARATORS.has(text);
}

function isOptionalChord(text: string): boolean {
    return text.startsWith('(') && text.endsWith(')');
}

/**
 * Scan a chord line left-to-right and return an ordered list of tokens
 * with their column offset and formatted output string.
 */
function tokenize(chordLine: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;

    while (i < chordLine.length) {
        if (chordLine[i] === ' ') {
            i++;
            continue;
        }

        const offset = i;
        let j = i;

        while (j < chordLine.length && chordLine[j] !== ' ') {
            j++;
        }

        const raw = chordLine.slice(i, j);

        let formatted: string;
        if (isBarSeparator(raw)) {
            formatted = raw;
        } else if (isOptionalChord(raw)) {
            const inner = raw.slice(1, -1);
            formatted = `([${inner}])`;
        } else {
            formatted = `[${raw}]`;
        }

        tokens.push({ offset, formatted });
        i = j;
    }

    return tokens;
}

/**
 * Convert a (chordLine, lyricLine) pair into a single bracketed inline string.
 *
 * Each token from `chordLine` is inserted into `lyricLine` at the corresponding
 * character offset (original lyric coordinates):
 * - Regular chords become [chord]
 * - Optional chords (Am) become ([Am])
 * - Bar separators (|, ||, ||:, :||) are inserted without brackets
 *
 * If the lyric is shorter than a token's offset it is padded with spaces.
 * If the lyric is empty all tokens are concatenated directly (instrumental line).
 */
export function formatBracketed(chordLine: string, lyricLine: string): string {
    const tokens = tokenize(chordLine);

    if (tokens.length === 0) {
        return lyricLine;
    }

    // Instrumental line: no lyric to align with — just concatenate formatted tokens
    if (lyricLine.trim() === '') {
        return tokens.map((t) => t.formatted).join('');
    }

    let result = '';
    let end = 0; // current position in original lyric coordinate space

    for (const token of tokens) {
        if (token.offset <= lyricLine.length) {
            // Normal case: slice lyric up to the token's offset
            result += lyricLine.slice(end, token.offset);
        } else {
            // Beyond lyric end: output remaining lyric chars then pad with spaces
            if (end < lyricLine.length) {
                result += lyricLine.slice(end);
            }
            result += ' '.repeat(token.offset - Math.max(end, lyricLine.length));
        }
        end = token.offset;
        result += token.formatted;
    }

    // Append any remaining lyric characters after the last token
    if (end < lyricLine.length) {
        result += lyricLine.slice(end);
    }

    return result;
}
