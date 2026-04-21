import { parseChords } from '@/lib/chord/parseChord';
import findKey from '@/lib/key/findKey';
import isChordsOnly from '@/lib/chord/isChordsOnly';
import { determineSelectedRows, SelectedChordRows } from '@/lib/selectedrows/SelectedChordRows';
import { transpose } from '@/lib/transposer/TransposerUtil';
import { shouldKeyUseSharps, getSharpAlternative, NoteName } from '@/model/enums/NoteName';
import { transformFlatsToSharps } from '@/lib/note/NoteUtil';
import { parseBracketedLine } from '@/lib/onsong/bracketedParser';
import { formatBracketed } from '@/lib/onsong/bracketedFormatter';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CanonicalState {
    value: string;
    history: string[];
    selected: SelectedChordRows;
    key?: string;
}

/** Extract chord names from [bracket] tokens for key detection. */
function extractBracketedChords(value: string): string {
    return (value.match(/\[([^\]]+)\]/g) ?? []).map((b) => b.slice(1, -1)).join(' ');
}

function calculateKey(value: string): string | undefined {
    const chordString = extractBracketedChords(value);
    if (!chordString.trim()) return undefined;
    const chords = parseChords(chordString);
    return findKey(chords);
}

/**
 * Transpose all chord tokens in the canonical string.
 * Bracket tokens ([Am], ([Am])) are transposed in place.
 * Chord-only lines (no brackets) are transposed using the full-line transpose.
 */
function transposeCanonical(value: string, steps: number): string {
    return value
        .split('\n')
        .map((line) => {
            if (!line.trim()) return line;
            if (isChordsOnly(line)) {
                return transpose(line, steps);
            }
            return line
                .replace(/\(\[([^\]]+)\]\)/g, (_, c) => `([${transpose(c, steps)}])`)
                .replace(/\[([^\]]+)\]/g, (_, c) => `[${transpose(c, steps)}]`);
        })
        .join('\n');
}

function flatsToSharpsCanonical(value: string): string {
    return value
        .split('\n')
        .map((line) => {
            if (!line.trim()) return line;
            if (isChordsOnly(line)) return transformFlatsToSharps(line);
            return line
                .replace(/\(\[([^\]]+)\]\)/g, (_, c) => `([${transformFlatsToSharps(c)}])`)
                .replace(/\[([^\]]+)\]/g, (_, c) => `[${transformFlatsToSharps(c)}]`);
        })
        .join('\n');
}

export const canonicalSlice = createSlice({
    name: 'canonical',
    initialState: {
        value: '',
        history: [],
        selected: {},
        key: undefined,
    } as CanonicalState,
    reducers: {
        setCanonical: (state, action: PayloadAction<string>) => {
            state.history.push(state.value);
            state.value = action.payload;
            state.key = calculateKey(action.payload);
        },
        replaceLine: (state, action: PayloadAction<{ lineIndex: number; newLine: string }>) => {
            state.history.push(state.value);
            const lines = state.value.split('\n');
            lines[action.payload.lineIndex] = action.payload.newLine;
            state.value = lines.join('\n');
            state.key = calculateKey(state.value);
        },
        transposeAll: (state, action: PayloadAction<number>) => {
            state.history.push(state.value);
            const transposed = transposeCanonical(state.value, action.payload);
            const key = calculateKey(transposed);
            if (key && shouldKeyUseSharps(key as NoteName)) {
                state.value = flatsToSharpsCanonical(transposed);
                state.key = getSharpAlternative(key as NoteName);
            } else {
                state.value = transposed;
                state.key = key;
            }
        },
        moveDown: (state, action: PayloadAction<number>) => {
            state.history.push(state.value);
            const lineIndex = action.payload;
            const lines = state.value.split('\n');

            if (lineIndex >= lines.length) {
                // Past end: just append a blank line
                lines.push('');
                state.value = lines.join('\n');
                return;
            }

            const { chord: chordStr, lyric } = parseBracketedLine(lines[lineIndex]);

            if (chordStr) {
                // Has chord: strip chord from current line, move it to the next lyric line
                lines[lineIndex] = lyric;
                const nextIdx = lineIndex + 1;
                if (nextIdx < lines.length) {
                    const { lyric: nextLyric } = parseBracketedLine(lines[nextIdx]);
                    lines[nextIdx] = formatBracketed(chordStr, nextLyric);
                } else {
                    // No next line: append chord-only line
                    lines.push(chordStr);
                }
            } else {
                // Pure lyric or empty: insert blank separator line above
                lines.splice(lineIndex, 0, '');
            }

            state.value = lines.join('\n');
        },
        moveUp: (state, action: PayloadAction<number>) => {
            state.history.push(state.value);
            if (action.payload <= 0) return;
            const lines = state.value.split('\n');
            lines.splice(action.payload - 1, 1);
            state.value = lines.join('\n');
        },
        pasteSelected: (state, action: PayloadAction<number>) => {
            state.history.push(state.value);
            const { from, to } = state.selected;
            if (typeof from === 'undefined') return;

            const lines = state.value.split('\n');
            const indexes =
                typeof to !== 'undefined'
                    ? Array.from({ length: to - from + 1 }, (_, i) => from + i)
                    : [from];
            const selectedLines = indexes.map((i) => lines[i] ?? '');

            const targetIdx = action.payload;
            const before = targetIdx === 0 ? [] : lines.slice(0, targetIdx);
            const after = lines.slice(targetIdx + selectedLines.length + 1);
            state.value = [...before, ...selectedLines, ...after].join('\n');
            state.key = calculateKey(state.value);
        },
        resetCanonical: (state) => {
            state.history.push(state.value);
            state.value = '';
            state.key = undefined;
        },
        undo: (state) => {
            if (state.history.length > 0) {
                state.value = state.history[state.history.length - 1];
                state.history.pop();
                state.key = calculateKey(state.value);
            }
        },
        setSelected: (state, action: PayloadAction<number>) => {
            state.selected = determineSelectedRows(state.selected, action.payload);
        },
        clearSelected: (state) => {
            state.selected = {};
        },
    },
});

export const {
    setCanonical,
    replaceLine,
    transposeAll,
    moveDown,
    moveUp,
    pasteSelected,
    resetCanonical,
    undo,
    setSelected,
    clearSelected,
} = canonicalSlice.actions;

export default canonicalSlice.reducer;
