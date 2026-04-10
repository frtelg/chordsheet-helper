import { OnsongFormat } from '@/redux/reducer/AppReducer';
import { formatBracketed } from './bracketedFormatter';

function isInstrumental(chordLine: string, lyricLine: string): boolean {
    return chordLine.trim() !== '' && lyricLine.trim() === '';
}

/**
 * Assemble a complete chord sheet string for the given format.
 *
 * chords-over-lyrics:
 *   - Row with chords → chord line + lyric line (2 lines; lyric is blank for instrumental rows)
 *   - Row without chords → lyric line only
 *
 * bracketed:
 *   - Normal row with chords → single bracketed inline line
 *   - Instrumental row (chords, empty lyric) → bracketed chord tokens + trailing blank line
 *   - Row without chords → plain lyric line
 *
 * In both formats, consecutive instrumental rows are NOT separated by blank lines.
 * A blank line IS emitted on both sides of an instrumental section (before the first
 * instrumental row and after the last one), separating it from the surrounding lyric sections.
 */
export function formatChordSheet(
    format: OnsongFormat,
    chords: string[],
    songLines: string[]
): string {
    const lines: string[] = [];

    for (let i = 0; i < songLines.length; i++) {
        const chordLine = chords[i] ?? '';
        const lyricLine = songLines[i];
        const hasChords = chordLine.trim() !== '';
        const instrumental = isInstrumental(chordLine, lyricLine);
        const prevInstrumental = i > 0 && isInstrumental(chords[i - 1] ?? '', songLines[i - 1]);

        // Entering an instrumental section from a lyric section: emit a blank line before it
        const enteringInstrumental = instrumental && !prevInstrumental && i > 0 && lines.length > 0;

        if (format === 'chords-over-lyrics') {
            if (hasChords) {
                if (instrumental && prevInstrumental) {
                    // Suppress the blank line (empty lyric) between consecutive instrumental rows
                    while (lines.length > 0 && lines[lines.length - 1] === '') {
                        lines.pop();
                    }
                } else if (enteringInstrumental) {
                    lines.push('');
                }
                lines.push(chordLine);
                lines.push(lyricLine); // empty string for instrumental rows → becomes blank line
            } else {
                lines.push(lyricLine);
            }
        } else {
            // bracketed
            if (hasChords) {
                if (instrumental && prevInstrumental) {
                    // Suppress the blank line between consecutive instrumental rows
                    while (lines.length > 0 && lines[lines.length - 1] === '') {
                        lines.pop();
                    }
                } else if (enteringInstrumental) {
                    lines.push('');
                }
                lines.push(formatBracketed(chordLine, lyricLine));
                // Bracketed mode has no natural empty lyric line — add an explicit blank line
                // after instrumental rows so the next lyric section is separated.
                // Consecutive-instrumental suppression above will remove it if the next row
                // is also instrumental.
                if (instrumental) {
                    lines.push('');
                }
            } else {
                lines.push(lyricLine);
            }
        }
    }

    // Remove any trailing blank lines
    while (lines.length > 0 && lines[lines.length - 1] === '') {
        lines.pop();
    }

    return lines.join('\n');
}
