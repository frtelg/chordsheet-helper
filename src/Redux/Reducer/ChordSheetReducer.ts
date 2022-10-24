import { transpose } from './../../Util/TransposerUtil';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export const chordSheetSlice = createSlice({
    name: 'chordSheet',
    initialState: {
        value: [] as string[],
        history: [] as string[][],
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
    },
});

export const { setChords, transposeAll, resetChords, moveUp, moveDown, undo } =
    chordSheetSlice.actions;

export default chordSheetSlice.reducer;
