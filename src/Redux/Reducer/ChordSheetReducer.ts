import { transpose } from './../../Util/TransposerUtil';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type SelectedChords = {
    from?: number;
    to?: number;
};

export const chordSheetSlice = createSlice({
    name: 'chordSheet',
    initialState: {
        value: [] as string[],
        history: [] as string[][],
        selected: {} as SelectedChords,
    },
    reducers: {
        setChords: (state, action: PayloadAction<string[]>) => {
            state.history.push(state.value);
            state.value = action.payload;
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
            state.value = state.value.map((c) => (c ? transpose(c, action.payload) : c));
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
            if (typeof state.selected.from === 'undefined') {
                state.selected = {
                    ...state.selected,
                    from: action.payload,
                };

                return;
            }

            if (!state.selected.to) {
                if (state.selected.from > action.payload) {
                    state.selected = {
                        from: action.payload,
                        to: state.selected.from,
                    };

                    return;
                }

                if (state.selected.from < action.payload) {
                    state.selected = {
                        ...state.selected,
                        to: action.payload,
                    };

                    return;
                }

                state.selected = {
                    from: undefined,
                    to: undefined,
                };

                return;
            }

            if (action.payload === state.selected.from) {
                state.selected = {
                    from: action.payload + 1,
                    to: state.selected.to > action.payload + 1 ? state.selected.to : undefined,
                };

                return;
            }

            if (action.payload < state.selected.from) {
                state.selected = {
                    ...state.selected,
                    from: action.payload,
                };

                return;
            }

            if (action.payload < state.selected.to) {
                state.selected = {
                    ...state.selected,
                    to: action.payload - 1,
                };

                return;
            }

            if (action.payload > state.selected.to) {
                state.selected = {
                    ...state.selected,
                    to: action.payload,
                };

                return;
            }

            state.selected = {
                ...state.selected,
                to: action.payload > state.selected.from ? action.payload - 1 : undefined,
            };
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
