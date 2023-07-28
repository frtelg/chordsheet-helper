import { createSlice } from '@reduxjs/toolkit';

export const appSlice = createSlice({
    name: 'app',
    initialState: {
        showResult: false,
    },
    reducers: {
        toggleShowResult: (state) => {
            state.showResult = !state.showResult;
        },
    },
});

export const { toggleShowResult } = appSlice.actions;

export default appSlice.reducer;
