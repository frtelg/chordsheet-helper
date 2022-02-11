import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export const chordSheetSlice = createSlice({
  name: "chordSheet",
  initialState: {
    value: [] as string[],
  },
  reducers: {
    setChords: (state, action: PayloadAction<string[]>) => {
      state.value = action.payload;
    },
  },
});

export const { setChords } = chordSheetSlice.actions;

export default chordSheetSlice.reducer;
