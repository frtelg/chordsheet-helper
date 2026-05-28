import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type OnsongFormat = 'chords-over-lyrics' | 'bracketed';

export const appSlice = createSlice({
    name: 'app',
    initialState: {
        showResult: false,
        onsongFormat: 'chords-over-lyrics' as OnsongFormat,
        enableNewRowUx: true,
    },
    reducers: {
        toggleShowResult: (state) => {
            state.showResult = !state.showResult;
        },
        setOnsongFormat: (state, action: PayloadAction<OnsongFormat>) => {
            state.onsongFormat = action.payload;
        },
        setEnableNewRowUx: (state, action: PayloadAction<boolean>) => {
            state.enableNewRowUx = action.payload;
        },
    },
});

export const { toggleShowResult, setOnsongFormat, setEnableNewRowUx } = appSlice.actions;

export default appSlice.reducer;
