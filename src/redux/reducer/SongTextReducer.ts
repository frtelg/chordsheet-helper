import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export const songTextSlice = createSlice({
    name: 'songText',
    initialState: {
        value: '',
    },
    reducers: {
        setSongText: (state, action: PayloadAction<string>) => {
            state.value = action.payload;
        },
        resetSongText: (state) => {
            state.value = '';
        },
    },
});

export const { setSongText, resetSongText } = songTextSlice.actions;

export default songTextSlice.reducer;
