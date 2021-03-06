import { transpose } from './../../Util/TransposerUtil';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export const chordSheetSlice = createSlice({
    name: 'chordSheet',
    initialState: {
        value: [] as string[],
    },
    reducers: {
        setChords: (state, action: PayloadAction<string[]>) => {
            state.value = action.payload;
        },
        transposeAll: (state, action: PayloadAction<number>) => {
            state.value = state.value.map((c) => (c ? transpose(c, action.payload) : c));
        },
        resetChords: (state) => {
            state.value = [] as string[];
        },
    },
});

export const { setChords, transposeAll, resetChords } = chordSheetSlice.actions;

export default chordSheetSlice.reducer;
