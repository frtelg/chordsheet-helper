import { parseChords } from '@/lib/chord/parseChord';
import findKey from '@/lib/key/findKey';
import { transformFlatsToSharps } from '@/lib/note/NoteUtil';
import { determineSelectedRows, SelectedChordRows } from '@/lib/selectedrows/SelectedChordRows';
import { transpose } from '@/lib/transposer/TransposerUtil';
import { shouldKeyUseSharps, getSharpAlternative } from '@/model/enums/NoteName';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ChordSheetState {
    value: string[];
    history: string[][];
    selected: SelectedChordRows;
    key?: string;
}

function calculateKey(chordRows: string[]) {
    const allChordsInOneString = chordRows.join(' ');
    const chords = parseChords(allChordsInOneString);

    return findKey(chords);
}

export const chordSheetSlice = createSlice({
    name: 'chordSheet',
    initialState: {
        value: [],
        history: [],
        selected: {},
        key: undefined,
    } as ChordSheetState,
    reducers: {
        setChords: (state, action: PayloadAction<string[]>) => {
            state.history.push(state.value);
            state.value = action.payload;
            state.key = calculateKey(action.payload);
        },
        moveDown: (state, action: PayloadAction<number>) => {
            state.history.push(state.value);
            state.value = [
                ...state.value.slice(0, action.payload),
                '',
                ...state.value.slice(action.payload),
            ];
        },
        moveUp: (state, action: PayloadAction<number>) => {
            state.history.push(state.value);
            if (action.payload <= 1) {
                state.value = state.value.slice(1);
            } else {
                state.value = [
                    ...state.value.slice(0, action.payload - 1),
                    ...state.value.slice(action.payload),
                ];
            }
        },
        transposeAll: (state, action: PayloadAction<number>) => {
            state.history.push(state.value);
            const newValue = state.value.map((c) => (c ? transpose(c, action.payload) : c));

            const key = calculateKey(newValue);

            if (key && shouldKeyUseSharps(key)) {
                state.value = newValue.map((n) => transformFlatsToSharps(n));
                state.key = getSharpAlternative(key);
            } else {
                state.value = newValue;
                state.key = key;
            }
        },
        resetChords: (state) => {
            state.history.push(state.value);
            state.value = [] as string[];
        },
        undo: (state) => {
            if (state.history.length > 0) {
                state.value = state.history[state.history.length - 1];
                state.history.pop();
            }
        },
        setSelected: (state, action: PayloadAction<number>) => {
            const { selected } = state;
            const { payload } = action;

            state.selected = determineSelectedRows(selected, payload);
        },
        clearSelected: (state) => {
            state.selected = {};
        },
        pasteSelected: (state, action: PayloadAction<number>) => {
            state.history.push(state.value);
            const { from, to } = state.selected;

            if (typeof from === 'undefined') {
                return;
            }

            const indexes = to ? Array.from({ length: to - from + 1 }, (v, i) => from + i) : [from];

            const chords = indexes.map((i) => (state.value.length > i + 1 ? state.value[i] : ''));

            const firstSlice = action.payload === 0 ? [] : state.value.slice(0, action.payload);
            const lengthWithNewChords = firstSlice.length + chords.length;
            const lastSlice =
                state.value.length <= lengthWithNewChords
                    ? []
                    : state.value.slice(lengthWithNewChords + 1);

            state.value = [...firstSlice, ...chords, ...lastSlice];
        },
    },
});

export const {
    setChords,
    transposeAll,
    resetChords,
    moveUp,
    moveDown,
    undo,
    setSelected,
    clearSelected,
    pasteSelected,
} = chordSheetSlice.actions;

export default chordSheetSlice.reducer;
