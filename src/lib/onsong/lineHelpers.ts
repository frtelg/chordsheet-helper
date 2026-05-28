import isChordsOnly from '@/lib/chord/isChordsOnly';
import { parseBracketedLine } from '@/lib/onsong/bracketedParser';
import { formatBracketedLine } from '@/lib/onsong/bracketedFormatter';

/**
 * Extract the chord value from a canonical line.
 * - Bracketed line `[Am]lyric` or `[Am]`: returns the chord string (from parseBracketedLine)
 * - Pure chord-only line `Am G F` (no brackets): returns the whole line
 * - Lyric-only or empty line: returns `''`
 *
 * Bracket presence is checked first to distinguish `[Am]` (bracketed, chord='Am', lyric='')
 * from `Am G F` (pure chord-only, whole line is the chord value).
 */
export function extractChord(line: string): string {
    if (!line.trim()) return '';
    // If the line contains bracket tokens, parse via parseBracketedLine
    if (/\[/.test(line)) return parseBracketedLine(line).chord;
    // Pure chord-only line (no brackets): entire line is the chord
    if (isChordsOnly(line)) return line;
    return ''; // lyric-only line
}

/**
 * Extract the lyric value from a canonical line.
 * - Bracketed line `[Am]lyric`: returns the lyric string
 * - Bracketed line `[Am]` (empty lyric): returns `''`
 * - Pure chord-only line: returns `''`
 * - Lyric-only line: returns the whole line
 * - Empty line: returns `''`
 */
export function extractLyric(line: string): string {
    if (!line.trim()) return '';
    // If the line contains bracket tokens, parse via parseBracketedLine
    if (/\[/.test(line)) return parseBracketedLine(line).lyric;
    // Pure chord-only line: no lyric
    if (isChordsOnly(line)) return '';
    return line; // lyric-only line
}

/**
 * Rebuild a canonical line from chord and lyric strings.
 * - Both non-empty: `formatBracketedLine(chord, lyric)` → `[chord]lyric`
 * - Chord empty, lyric non-empty: lyric-only line
 * - Chord non-empty, lyric empty: chord-only line
 * - Both empty: `''`
 */
export function rebuildLine(chord: string, lyric: string): string {
    if (!chord && !lyric) return '';
    if (!chord) return lyric;
    return formatBracketedLine(chord, lyric);
}
