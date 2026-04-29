import isChordsOnly from '@/lib/chord/isChordsOnly';

const BAR_SEPARATORS = new Set(['|', '||', '||:', ':||', '|:', ':|', '/']);

type Token = {
    offset: number;
    raw: string;
    formatted: string;
};

function isBarSeparator(text: string): boolean {
    return BAR_SEPARATORS.has(text);
}

function isOptionalChord(text: string): boolean {
    return text.startsWith('(') && text.endsWith(')');
}

/**
 * Scan a chord line left-to-right and return an ordered list of tokens
 * with their column offset, raw source text, and formatted output string.
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

        tokens.push({ offset, raw, formatted });
        i = j;
    }

    return tokens;
}

/**
 * Emit a single canonical bracketed line from chord and lyric strings.
 * Delegates to formatBracketed; exposed separately for clarity at call sites.
 */
export function formatBracketedLine(chord: string, lyric: string): string {
    return formatBracketed(chord, lyric);
}

/**
 * Convert chords-over-lyrics input to a canonical bracketed OnSong string.
 * Pairs each isChordsOnly line with the following lyric line (if any);
 * consecutive chord-only lines or chord-only lines without a following lyric
 * are treated as instrumental rows.
 */
export function chordsOverLyricsToBracketed(input: string): string {
    const inputLines = input.split('\n');
    const outputLines: string[] = [];
    let i = 0;

    while (i < inputLines.length) {
        const line = inputLines[i];
        if (isChordsOnly(line)) {
            // Strip existing bracket notation before re-formatting to avoid double-bracketing.
            const rawChord = line
                .replace(/\(\[([^\]]+)\]\)/g, '($1)')
                .replace(/\[([^\]]+)\]/g, '$1');
            const nextLine = inputLines[i + 1];
            if (!nextLine || isChordsOnly(nextLine)) {
                outputLines.push(formatBracketed(rawChord, ''));
                i++;
            } else if (rawChord.includes('|')) {
                // Bar-notation chord line: always instrumental — following line stays separate
                outputLines.push(formatBracketed(rawChord, ''));
                i++;
            } else {
                outputLines.push(formatBracketed(rawChord, nextLine));
                i += 2;
            }
        } else {
            outputLines.push(line);
            i++;
        }
    }

    return outputLines.join('\n');
}

/**
 * Convert a (chordLine, lyricLine) pair into a single bracketed inline string.
 *
 * Each token from `chordLine` is inserted into `lyricLine` at the corresponding
 * character offset (original lyric coordinates):
 * - Regular chords become [chord]
 * - Optional chords (Am) become ([Am])
 * - Bar separators (|, ||, ||:, :||, |:, :|, /) are inserted without brackets
 *
 * If the lyric is shorter than a token's offset it is padded with spaces.
 * If the lyric is empty, inter-token whitespace from the chord line is preserved verbatim.
 */
export function formatBracketed(chordLine: string, lyricLine: string): string {
    const tokens = tokenize(chordLine);

    if (tokens.length === 0) {
        return lyricLine;
    }

    // Instrumental line: no lyric to align with — walk the source chord line,
    // preserving whitespace between tokens verbatim.
    if (lyricLine.trim() === '') {
        let result = '';
        let pos = 0;
        for (const token of tokens) {
            result += chordLine.slice(pos, token.offset);
            result += token.formatted;
            pos = token.offset + token.raw.length;
        }
        return result;
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
