import isChordsOnly from '@/lib/chord/isChordsOnly';

export interface Row {
    id: string;
    chord: string;
    lyric: string;
    isInstrumental: boolean;
    sourceLineIndex: number;
    precededByBlank: boolean;
}

/**
 * Parse a single bracketed canonical line into chord and lyric components.
 * Exported for use by the reducer when rearranging lines (e.g. moveDown).
 *
 * Bracket tokens ([Am], ([Am])) are extracted with their lyric column positions.
 * The chord string is rebuilt by placing chord names at their lyric positions.
 * The lyric string is the raw text with bracket tokens removed.
 */
export function parseBracketedLine(line: string): { chord: string; lyric: string } {
    if (!line.trim()) return { chord: '', lyric: '' };

    const chordPositions: { name: string; lyricPos: number }[] = [];
    let lyric = '';
    let lyricPos = 0;
    let i = 0;

    while (i < line.length) {
        if (line[i] === '(' && i + 1 < line.length && line[i + 1] === '[') {
            const end = line.indexOf('])', i);
            if (end !== -1) {
                const chordName = line.slice(i + 2, end);
                chordPositions.push({ name: `(${chordName})`, lyricPos });
                i = end + 2;
                continue;
            }
        }
        if (line[i] === '[') {
            const end = line.indexOf(']', i);
            if (end !== -1) {
                const chordName = line.slice(i + 1, end);
                chordPositions.push({ name: chordName, lyricPos });
                i = end + 1;
                continue;
            }
        }
        lyric += line[i];
        lyricPos++;
        i++;
    }

    if (chordPositions.length === 0) return { chord: '', lyric };

    // Build chord string: place chord names at their lyric column positions
    const maxNeeded = Math.max(...chordPositions.map((c) => c.lyricPos + c.name.length));
    const chordArr = new Array(maxNeeded + 1).fill(' ');
    for (const { name, lyricPos: pos } of chordPositions) {
        for (let j = 0; j < name.length; j++) {
            chordArr[pos + j] = name[j];
        }
    }
    const chord = chordArr.join('').trimEnd();

    return { chord, lyric };
}

/** Extract chord name strings from [bracket] tokens in a single line. */
export function extractChords(line: string): string[] {
    return (line.match(/\[([^\]]+)\]/g) ?? []).map((b) => b.slice(1, -1));
}

/**
 * Strip bracket notation from a line, returning the raw chord content.
 * [Am] → Am, ([Am]) → (Am), | [G] | [D] | → | G | D |
 */
export function stripBrackets(line: string): string {
    return line.replace(/\(\[([^\]]+)\]\)/g, '($1)').replace(/\[([^\]]+)\]/g, '$1');
}

/**
 * Parse a canonical bracketed OnSong string into an ordered array of rows.
 *
 * Rules:
 *   Rule A — a line satisfying isChordsOnly is an instrumental row (chord-only paired with empty lyric).
 *   Rule B — a maximal run of N empty lines produces max(0, N - 2) silent-rest rows;
 *             the remaining 2 (or fewer at sheet boundaries) are treated as separators
 *             and do not become rows. Sheet boundaries always act as a separator,
 *             so the rule simplifies to: rests = max(0, N - 2) for any run.
 */
export function parseCanonical(value: string): Row[] {
    if (!value) return [];

    const lines = value.split('\n');

    type Tag = 'empty' | 'chord-only' | 'lyric';
    const tags: Tag[] = lines.map((line) => {
        if (!line.trim()) return 'empty';
        if (isChordsOnly(line)) return 'chord-only';
        return 'lyric';
    });

    const rows: Row[] = [];
    let i = 0;
    let pendingBlank = false;

    while (i < lines.length) {
        if (tags[i] === 'chord-only') {
            rows.push({
                id: '',
                chord: stripBrackets(lines[i]),
                lyric: '',
                isInstrumental: true,
                sourceLineIndex: i,
                precededByBlank: pendingBlank,
            });
            pendingBlank = false;
            i++;
        } else if (tags[i] === 'empty') {
            const runStart = i;
            while (i < lines.length && tags[i] === 'empty') i++;
            const N = i - runStart;
            // Consume 1 separator per adjacent instrumental block (chord-only);
            // otherwise 2 separators (lyric or sheet boundary on each side).
            const prevTag = runStart > 0 ? tags[runStart - 1] : null;
            const nextTag = i < lines.length ? tags[i] : null;
            const adjacentToChordOnly = prevTag === 'chord-only' || nextTag === 'chord-only';
            const rests = adjacentToChordOnly ? Math.max(0, N - 1) : Math.max(0, N - 2);
            const firstRestIndex = runStart + 1;
            if (rests > 0) {
                for (let r = 0; r < rests; r++) {
                    rows.push({
                        id: '',
                        chord: '',
                        lyric: '',
                        isInstrumental: true,
                        sourceLineIndex: firstRestIndex + r,
                        precededByBlank: false,
                    });
                }
                pendingBlank = false;
            } else if (N > 0) {
                // All blanks were consumed as separators, but there was at least one blank.
                // Flag the next row so renderOverLyrics can emit the visual separator.
                pendingBlank = true;
            }
        } else {
            const { chord, lyric } = parseBracketedLine(lines[i]);
            rows.push({
                id: '',
                chord,
                lyric,
                isInstrumental: false,
                sourceLineIndex: i,
                precededByBlank: pendingBlank,
            });
            pendingBlank = false;
            i++;
        }
    }

    return rows;
}
