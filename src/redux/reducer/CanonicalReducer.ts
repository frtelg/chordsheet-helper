import { parseChords } from '@/lib/chord/parseChord';
import findKey from '@/lib/key/findKey';
import isChordsOnly from '@/lib/chord/isChordsOnly';
import {
    applySelection,
    clearSelection,
    selectAll,
    SelectedChordRows,
    SelectionMode,
} from '@/lib/selectedrows/SelectedChordRows';
import { transpose } from '@/lib/transposer/TransposerUtil';
import { shouldKeyUseSharps, getSharpAlternative, NoteName } from '@/model/enums/NoteName';
import { transformFlatsToSharps } from '@/lib/note/NoteUtil';
import { extractChord, extractLyric, rebuildLine } from '@/lib/onsong/lineHelpers';
import { createSlice, nanoid, PayloadAction } from '@reduxjs/toolkit';

interface HistoryEntry {
    value: string;
    lineIds: string[];
}

interface CanonicalState {
    value: string;
    history: HistoryEntry[];
    lineIds: string[];
    selected: SelectedChordRows;
    /** Holds extracted chord VALUE strings (not whole canonical lines). */
    clipboard: string[];
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
 * Compute lineIds for a new canonical string, preserving IDs for lines that
 * appear in the same relative order in the old string (LCS-style).
 */
function computeLineIds(prevLines: string[], prevIds: string[], nextLines: string[]): string[] {
    const m = prevLines.length;
    const n = nextLines.length;

    const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (prevLines[i - 1] === nextLines[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }

    const nextToOldId = new Map<number, string>();
    let i = m;
    let j = n;
    while (i > 0 && j > 0) {
        if (prevLines[i - 1] === nextLines[j - 1]) {
            nextToOldId.set(j - 1, prevIds[i - 1]);
            i--;
            j--;
        } else if (dp[i - 1][j] > dp[i][j - 1]) {
            i--;
        } else {
            j--;
        }
    }

    return nextLines.map((_, idx) => nextToOldId.get(idx) ?? nanoid());
}

/**
 * Transpose all chord tokens in the canonical string.
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

const emptyState: CanonicalState = {
    value: '',
    history: [] as HistoryEntry[],
    lineIds: [],
    selected: { anchor: undefined, indexes: [] },
    clipboard: [],
    key: undefined,
};

/** Push a history snapshot before mutating. */
function pushHistory(state: CanonicalState): void {
    state.history.push({ value: state.value, lineIds: [...state.lineIds] });
}

export const canonicalSlice = createSlice({
    name: 'canonical',
    initialState: emptyState,
    reducers: {
        setCanonical: (state, action: PayloadAction<string>) => {
            pushHistory(state);
            const prevLines = state.value.split('\n');
            const nextLines = action.payload.split('\n');
            state.lineIds = computeLineIds(prevLines, state.lineIds, nextLines);
            state.value = action.payload;
            state.key = calculateKey(action.payload);
        },

        replaceLine: (state, action: PayloadAction<{ lineIndex: number; newLine: string }>) => {
            pushHistory(state);
            const lines = state.value.split('\n');
            lines[action.payload.lineIndex] = action.payload.newLine;
            state.value = lines.join('\n');
            state.lineIds[action.payload.lineIndex] = nanoid();
            state.key = calculateKey(state.value);
        },

        transposeAll: (state, action: PayloadAction<number>) => {
            pushHistory(state);
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

        /**
         * Chord-only move down: swap the chord VALUE of line N with line N+1.
         * Lyrics stay in place. lineIds are NOT swapped (lines don't reorder).
         * No-op at bottom boundary.
         */
        moveDown: (state, action: PayloadAction<number>) => {
            const lineIndex = action.payload;
            const lines = state.value.split('\n');
            if (lineIndex >= lines.length - 1) return;
            pushHistory(state);
            const chordN = extractChord(lines[lineIndex]);
            const chordNext = extractChord(lines[lineIndex + 1]);
            const lyricN = extractLyric(lines[lineIndex]);
            const lyricNext = extractLyric(lines[lineIndex + 1]);
            lines[lineIndex] = rebuildLine(chordNext, lyricN);
            lines[lineIndex + 1] = rebuildLine(chordN, lyricNext);
            state.value = lines.join('\n');
            state.key = calculateKey(state.value);
            // lineIds unchanged — canonical lines stay in the same positions
        },

        /**
         * Chord-only move up: swap the chord VALUE of line N with line N-1.
         * Lyrics stay in place. lineIds are NOT swapped (lines don't reorder).
         * No-op at top boundary.
         */
        moveUp: (state, action: PayloadAction<number>) => {
            const lineIndex = action.payload;
            if (lineIndex <= 0) return;
            const lines = state.value.split('\n');
            pushHistory(state);
            const chordN = extractChord(lines[lineIndex]);
            const chordPrev = extractChord(lines[lineIndex - 1]);
            const lyricN = extractLyric(lines[lineIndex]);
            const lyricPrev = extractLyric(lines[lineIndex - 1]);
            lines[lineIndex] = rebuildLine(chordPrev, lyricN);
            lines[lineIndex - 1] = rebuildLine(chordN, lyricPrev);
            state.value = lines.join('\n');
            state.key = calculateKey(state.value);
            // lineIds unchanged — canonical lines stay in the same positions
        },

        /**
         * Splice the canonical line at `from` to position `to` (full row reorder).
         * Updates lineIds in lockstep. Single history entry. No-op if from === to
         * or indices out of bounds.
         */
        moveRow: (state, action: PayloadAction<{ from: number; to: number }>) => {
            const { from, to } = action.payload;
            const lines = state.value.split('\n');
            if (from < 0 || from >= lines.length) return;
            if (to < 0 || to >= lines.length) return;
            if (from === to) return;
            pushHistory(state);
            const [movedLine] = lines.splice(from, 1);
            lines.splice(to, 0, movedLine);
            const [movedId] = state.lineIds.splice(from, 1);
            state.lineIds.splice(to, 0, movedId);
            state.value = lines.join('\n');
            state.key = calculateKey(state.value);
        },

        /**
         * Move selection up: left-rotate chord values in [minIdx-1 .. maxIdx].
         * The chord above the block shifts to the bottom of the block; the block shifts up.
         * Lyrics stay in place. No-op if selection is empty or at top boundary.
         */
        moveSelectionUp: (state) => {
            const indexes = [...state.selected.indexes].sort((a, b) => a - b);
            if (indexes.length === 0) return;
            const minIdx = indexes[0];
            const maxIdx = indexes[indexes.length - 1];
            if (minIdx <= 0) return;
            const lines = state.value.split('\n');
            pushHistory(state);
            // Extract chord values for the rotation range [minIdx-1 .. maxIdx]
            const range = Array.from({ length: maxIdx - minIdx + 2 }, (_, i) => minIdx - 1 + i);
            const chords = range.map((i) => extractChord(lines[i]));
            const lyrics = range.map((i) => extractLyric(lines[i]));
            // Left-rotate: chords[1..n] → positions[0..n-1], chords[0] → position[n]
            const rotated = [...chords.slice(1), chords[0]];
            for (let i = 0; i < range.length; i++) {
                lines[range[i]] = rebuildLine(rotated[i], lyrics[i]);
            }
            state.value = lines.join('\n');
            state.key = calculateKey(state.value);
            // Selection shifts up by one
            state.selected = {
                anchor: state.selected.anchor !== undefined ? state.selected.anchor - 1 : undefined,
                indexes: indexes.map((idx) => idx - 1),
            };
        },

        /**
         * Move selection down: right-rotate chord values in [minIdx .. maxIdx+1].
         * The chord below the block shifts to the top of the block; the block shifts down.
         * Lyrics stay in place. No-op if selection is empty or at bottom boundary.
         */
        moveSelectionDown: (state) => {
            const indexes = [...state.selected.indexes].sort((a, b) => a - b);
            if (indexes.length === 0) return;
            const minIdx = indexes[0];
            const maxIdx = indexes[indexes.length - 1];
            const lines = state.value.split('\n');
            if (maxIdx >= lines.length - 1) return;
            pushHistory(state);
            // Extract chord values for the rotation range [minIdx .. maxIdx+1]
            const range = Array.from({ length: maxIdx - minIdx + 2 }, (_, i) => minIdx + i);
            const chords = range.map((i) => extractChord(lines[i]));
            const lyrics = range.map((i) => extractLyric(lines[i]));
            // Right-rotate: chords[n] → position[0], chords[0..n-1] → positions[1..n]
            const rotated = [chords[chords.length - 1], ...chords.slice(0, -1)];
            for (let i = 0; i < range.length; i++) {
                lines[range[i]] = rebuildLine(rotated[i], lyrics[i]);
            }
            state.value = lines.join('\n');
            state.key = calculateKey(state.value);
            // Selection shifts down by one
            state.selected = {
                anchor: state.selected.anchor !== undefined ? state.selected.anchor + 1 : undefined,
                indexes: indexes.map((idx) => idx + 1),
            };
        },

        /**
         * Copy chord VALUE strings from selected rows into the clipboard.
         * Does not copy whole canonical lines.
         * No history push. Selection preserved.
         */
        copySelected: (state) => {
            if (state.selected.indexes.length === 0) return;
            const lines = state.value.split('\n');
            state.clipboard = [...state.selected.indexes]
                .sort((a, b) => a - b)
                .map((i) => extractChord(lines[i] ?? ''));
        },

        /**
         * Cut chord VALUES from selected rows: copy to clipboard, then clear chords
         * from source rows. Does NOT delete canonical lines. Lyrics stay.
         * One history entry.
         */
        cutSelected: (state) => {
            if (state.selected.indexes.length === 0) return;
            pushHistory(state);
            const lines = state.value.split('\n');
            const sortedIndexes = [...state.selected.indexes].sort((a, b) => a - b);
            state.clipboard = sortedIndexes.map((i) => extractChord(lines[i] ?? ''));
            for (const idx of sortedIndexes) {
                lines[idx] = rebuildLine('', extractLyric(lines[idx] ?? ''));
            }
            state.value = lines.join('\n');
            state.key = calculateKey(state.value);
            // lineIds unchanged — no lines deleted
        },

        /**
         * Paste chord VALUES onto rows starting at targetIdx going downward.
         * Overwrites chord values at targetIdx, targetIdx+1, … with clipboard values.
         * Lyrics at those rows are untouched. Does NOT insert new canonical lines.
         * One history entry.
         */
        pasteChords: (state, action: PayloadAction<number>) => {
            if (state.clipboard.length === 0) return;
            const lines = state.value.split('\n');
            const targetIdx = action.payload;
            if (targetIdx < 0 || targetIdx >= lines.length) return;
            pushHistory(state);
            for (let i = 0; i < state.clipboard.length; i++) {
                const lineIdx = targetIdx + i;
                if (lineIdx >= lines.length) break;
                lines[lineIdx] = rebuildLine(state.clipboard[i], extractLyric(lines[lineIdx]));
            }
            state.value = lines.join('\n');
            state.key = calculateKey(state.value);
            // lineIds unchanged — no lines added or removed
        },

        /**
         * Clear chord VALUES from selected rows. Does NOT delete canonical lines.
         * Lyrics stay. One history entry.
         */
        clearChords: (state) => {
            if (state.selected.indexes.length === 0) return;
            pushHistory(state);
            const lines = state.value.split('\n');
            for (const idx of state.selected.indexes) {
                lines[idx] = rebuildLine('', extractLyric(lines[idx] ?? ''));
            }
            state.value = lines.join('\n');
            state.key = calculateKey(state.value);
        },

        resetCanonical: (state) => {
            pushHistory(state);
            state.value = '';
            state.lineIds = [];
            state.key = undefined;
            state.selected = clearSelection();
        },

        undo: (state) => {
            if (state.history.length > 0) {
                const entry = state.history[state.history.length - 1];
                state.value = entry.value;
                state.lineIds = entry.lineIds;
                state.history.pop();
                state.key = calculateKey(state.value);
            }
        },

        setSelected: (state, action: PayloadAction<{ index: number; mode: SelectionMode }>) => {
            state.selected = applySelection(state.selected, action.payload);
        },

        setSelectedAll: (state, action: PayloadAction<number>) => {
            state.selected = selectAll(action.payload);
        },

        clearSelected: (state) => {
            state.selected = clearSelection();
        },
    },
});

export const {
    setCanonical,
    replaceLine,
    transposeAll,
    moveDown,
    moveUp,
    moveRow,
    moveSelectionUp,
    moveSelectionDown,
    copySelected,
    cutSelected,
    pasteChords,
    clearChords,
    resetCanonical,
    undo,
    setSelected,
    setSelectedAll,
    clearSelected,
} = canonicalSlice.actions;

export default canonicalSlice.reducer;
