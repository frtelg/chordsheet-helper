import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type OnsongFormat = 'chords-over-lyrics' | 'bracketed';

export const appSlice = createSlice({
    name: 'app',
    initialState: {
        showResult: false,
        onsongFormat: 'chords-over-lyrics' as OnsongFormat,
    },
    reducers: {
        toggleShowResult: (state) => {
            state.showResult = !state.showResult;
        },
        setOnsongFormat: (state, action: PayloadAction<OnsongFormat>) => {
            state.onsongFormat = action.payload;
        },
    },
});

export const { toggleShowResult, setOnsongFormat } = appSlice.actions;

export default appSlice.reducer;
